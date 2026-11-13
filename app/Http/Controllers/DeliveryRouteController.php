<?php

namespace App\Http\Controllers;

use App\Models\PreOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Fitur Rute Pengantaran: susun urutan kunjungan efisien dari titik
 * dapur ke para pembeli PO berstatus belum diserahkan.
 *
 * Koordinat pembeli diambil dari kolom latitude/longitude penjualans
 * (diisi via paste link Google Maps). Pembeli yang hanya alamat teks
 * diestimasi titiknya via Nominatim di sisi client saat pertama kali
 * dicari, lalu bisa digeser manual di peta.
 */
class DeliveryRouteController extends Controller
{
    public function index(Request $request): Response
    {
        $batches = PreOrder::orderByDesc('created_at')->get(['id', 'kode', 'keterangan', 'status']);

        return Inertia::render('DeliveryRoute/Index', [
            'batches' => $batches,
            'dapur' => $this->getDapur(),
        ]);
    }

    /**
     * Pembeli satu batch yang belum diserahkan + koordinatnya.
     */
    public function batchStops(Request $request, PreOrder $batch): \Illuminate\Http\JsonResponse
    {
        $stops = DB::table('penjualans')
            ->where('pre_order_id', $batch->id)
            ->where('status_penyerahan', 'belum_diberikan')
            ->orderBy('id')
            ->get([
                'id',
                'no_faktur',
                'nama_lengkap',
                'alamat',
                'no_telepon',
                'latitude',
                'longitude',
                'status_penyerahan',
            ])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'no_faktur' => $row->no_faktur,
                'nama' => $row->nama_lengkap ?? 'Tanpa nama',
                'alamat' => $row->alamat,
                'no_telepon' => $row->no_telepon,
                'latitude' => $row->latitude !== null ? (float) $row->latitude : null,
                'longitude' => $row->longitude !== null ? (float) $row->longitude : null,
                'punya_titik' => $row->latitude !== null && $row->longitude !== null,
                'status_penyerahan' => $row->status_penyerahan,
            ])
            ->all();

        return response()->json(['stops' => $stops]);
    }

    /**
     * Simpan koordinat yang diestimasi/pinges manual supaya tidak perlu
     * mencari ulang di rute berikutnya.
     */
    public function setStopPoint(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'id' => 'required|exists:penjualans,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'alamat' => 'nullable|string|max:1000',
        ]);

        $update = [
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
        ];
        if (! empty($validated['alamat'])) {
            $update['alamat'] = $validated['alamat'];
        }

        DB::table('penjualans')->where('id', $validated['id'])->update($update);

        return response()->json(['ok' => true]);
    }

    /**
     * Resolve link Google Maps (termasuk short link maps.app.goo.gl) menjadi
     * koordinat. Dilakukan SERVER-SIDE karena browser dibatasi CORS ketika
     * fetch langsung ke google.com.
     */
    public function resolveGmaps(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'url' => 'required_without:q|nullable|url|max:2048',
            'q' => 'required_without:url|nullable|string|max:500',
        ]);

        // Mode geocode alamat teks (estimasi server yang lebih toleran)
        if (! empty($validated['q'])) {
            $titik = $this->geocodeProgresif($validated['q']);

            return response()->json(['titik' => $titik]);
        }

        $url = (string) $validated['url'];

        // 1. Koordinat langsung di URL asli (@lat,lng / q= / !3d!4d)
        $titik = $this->ekstrakKoordinat($url);
        if ($titik) {
            return response()->json(['titik' => $titik]);
        }

        // 2. Ikuti redirect (short link) - maksimal 5 hop, timeout 10s
        try {
            $res = Http::timeout(10)
                ->withOptions(['allow_redirects' => ['max' => 5]])
                ->get($url);
            $finalUrl = (string) $res->effectiveUri();
        } catch (\Throwable) {
            return response()->json(['titik' => null], 200);
        }

        $titik = $this->ekstrakKoordinat($finalUrl);
        if ($titik) {
            return response()->json(['titik' => $titik]);
        }

        // 3. URL final tanpa koordinat: cek q=<nama tempat> (plus code /
        // alamat). JANGAN parse koordinat dari body HTML Google - HTML-nya
        // mengandung koordinat server yang acak (bisa "ke China").
        // Contoh nyata: q=H6XW+4XX Seblak Tararasik, Karang Bawang,
        // Grendeng, Purwokerto Utara -> geocode nama tempatnya.
        $namaTempat = $this->ambilParamQ($finalUrl);
        if ($namaTempat !== null) {
            $titik = $this->geocodeProgresif($namaTempat);
            if ($titik) {
                return response()->json(['titik' => $titik]);
            }
        }

        // 4. Place link tanpa q (mis. /maps/place/Seblak+Tararasik/...):
        // ekstrak nama tempat dari path URL lalu geocode.
        if (preg_match('#/maps/place/([^/]+)#', $finalUrl, $m)) {
            $namaTempat = urldecode($m[1]);
            $namaTempat = preg_replace('/@.*$/', '', $namaTempat); // buang @lat,lng bila ada
            if ($namaTempat !== '' && ! isGmapsHostOnly($namaTempat)) {
                $titik = $this->geocodeProgresif($namaTempat);
                if ($titik) {
                    return response()->json(['titik' => $titik]);
                }
            }
        }

        return response()->json(['titik' => null]);
    }

    /** Ambil nilai param ?q= dari URL (decoded), atau null. */
    private function ambilParamQ(string $url): ?string
    {
        $query = parse_url($url, PHP_URL_QUERY);
        if (! $query) {
            return null;
        }
        parse_str($query, $params);
        $q = $params['q'] ?? $params['query'] ?? null;
        if (! is_string($q) || $q === '') {
            return null;
        }

        // Buang plus code di awal (mis. "H6XW+4XX Seblak ...") - Nominatim
        // tidak paham plus code, nama tempatnya saja yang dicari.
        $q = preg_replace('/\b[23456789CFGHJMPQRVWX]{4,6}\+[23456789CFGHJMPQRVWX]{2,3}\b\s*/u', '', $q);

        return trim($q);
    }

    /**
     * Geocode progresif: alamat lengkap hasil redirect gmaps hampir selalu
     * GAGAL di Nominatim bila langsung (terlalu panjang / region membloat).
     * Strategi teruji: buang segmen umum (negara/provinsi/postal/regency),
     * lalu coba beberapa varian ringkas. Max 4 request, hormati rate limit
     * 1 req/s. Contoh nyata yang kini berhasil:
     * "H6XW+4XX Seblak Tararasik, Karang Bawang, Grendeng, Purwokerto
     *   Utara, Banyumas Regency, Central Java 53122, Indonesia"
     *   -> varian "Karang Bawang, Purwokerto Utara"-like di sekitar
     *      Purwokerto (bukan lagi koordinat server Google).
     */
    private function geocodeProgresif(string $alamat): ?array
    {
        // Buang plus code di mana pun posisinya. Catatan: parse_str sudah
        // mengubah '+' menjadi spasi, jadi pola harus menerima spasi juga.
        // Charset plus code tidak memuat vokal, jadi kata biasa (yang pasti
        // ber vowels) aman dari pola ini.
        $alamat = preg_replace('/\b[23456789CFGHJMPQRVWX]{4,6}[+\s][23456789CFGHJMPQRVWX]{2,3}\b\s*/u', '', $alamat);

        // Pecah segmen & buang yang berisik (negara, provinsi, postal, "Regency"/"City"/"Kabupaten")
        $segmen = array_values(array_filter(
            array_map('trim', explode(',', $alamat)),
            fn ($s) => $s !== '' && ! $this->segmenUmum($s),
        ));

        if (empty($segmen)) {
            $segmen = [trim($alamat)];
        }

        $n = count($segmen);
        $varian = [];

        // 1. Ringkas penuh (tanpa segmen umum)
        $varian[] = implode(', ', $segmen);

        // 2-5. Geser jendela 2 segmen (dua-duanya paling sering ketemu:
        // "kelurahan, kota" mis. "Grendeng, Purwokerto")
        for ($i = 0; $i + 1 < $n && count($varian) < 5; $i++) {
            $varian[] = $segmen[$i] . ', ' . $segmen[$i + 1];
        }

        // 6. Segmen pertama saja (nama tempat)
        if ($n > 1) {
            $varian[] = $segmen[0];
        }

        foreach ($varian as $i => $q) {
            if ($i > 0) {
                usleep(1100000); // rate limit Nominatim
            }
            $res = Http::timeout(10)
                ->withHeaders(['Accept' => 'application/json'])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'format' => 'json',
                    'limit' => 1,
                    'countrycodes' => 'id',
                    'q' => $q,
                ]);
            if ($res->ok()) {
                $data = $res->json();
                if (! empty($data[0]['lat'])) {
                    return ['lat' => (float) $data[0]['lat'], 'lng' => (float) $data[0]['lon']];
                }
            }
        }

        return null;
    }

    /** Segmen alamat yang terlalu umum (membuat Nominatim gagal). */
    private function segmenUmum(string $s): bool
    {
        // Kode pos murni
        if (preg_match('/^\d{5}$/', $s)) {
            return true;
        }
        // Indonesia / Jawa Tengah / Central Java / West Java / dsb.
        if (preg_match('/^(indonesia|jawa( tengah| barat| timur| selatan| utara)?|(central|west|east|north|south) java)$/i', $s)) {
            return true;
        }
        // Mengandung "Regency" / "City" / "Kabupaten" administratif besar
        if (preg_match('/\b(regency|city|kabupaten)\b/i', $s)) {
            return true;
        }

        return false;
    }

    private function ekstrakKoordinat(string $teks): ?array
    {
        $pola = [
            '/@(-?\d+\.\d+),(-?\d+\.\d+)/',
            '/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/',
            '/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/',
            '/[?&]destination=(-?\d+\.\d+),(-?\d+\.\d+)/',
            '/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/',
        ];
        foreach ($pola as $p) {
            if (preg_match($p, $teks, $m)) {
                $lat = (float) $m[1];
                $lng = (float) $m[2];
                if (abs($lat) <= 90 && abs($lng) <= 180 && ($lat != 0 || $lng != 0)) {
                    return ['lat' => $lat, 'lng' => $lng];
                }
            }
        }

        return null;
    }

/** Cek apakah teks cuma host/koordinat sisa, bukan nama tempat. */
function isGmapsHostOnly(string $teks): bool
{
    return (bool) preg_match('/^(maps\.google|www\.google|google\.[a-z.]+|@)/i', $teks);
}

    /**
     * Tandai satu pembeli sudah diserahkan dari halaman rute (tombol
     * "Sampai"). Logika stok sama dengan PenjualanController@fulfill.
     */
    public function completeStop(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'id' => 'required|integer|exists:penjualans,id',
        ]);

        $sale = \App\Models\Penjualan::with('detailPenjualans.produk')->find($validated['id']);

        if ($sale->status_penyerahan === 'sudah_diberikan') {
            return response()->json(['ok' => true, 'status_penyerahan' => 'sudah_diberikan']);
        }

        // Validasi stok seperti fulfill()
        $errors = [];
        foreach ($sale->detailPenjualans as $detail) {
            $produk = $detail->produk;
            if ($produk && $detail->qty > $produk->stok && $sale->status !== 'selesai') {
                $errors[] = "Stok \"{$produk->nama_produk}\" belum cukup (butuh {$detail->qty}, ada {$produk->stok}). Produksi dulu.";
            }
        }
        if ($errors !== []) {
            return response()->json(['ok' => false, 'pesan' => $errors[0]], 422);
        }

        DB::transaction(function () use ($sale) {
            foreach ($sale->detailPenjualans as $detail) {
                if ($detail->produk && $sale->status !== 'selesai') {
                    $detail->produk->decrement('stok', $detail->qty);
                }
            }
            $sale->update([
                'status' => 'selesai',
                'status_penyerahan' => 'sudah_diberikan',
                'tanggal_diberikan' => now(),
            ]);
        });

        return response()->json(['ok' => true, 'status_penyerahan' => 'sudah_diberikan']);
    }

    /** Titik awal & akhir rute: lokasi dapur dari settings. */
    public function setDapur(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'nama' => 'nullable|string|max:100',
        ]);

        DB::table('settings')->updateOrInsert(
            ['key' => 'dapur'],
            [
                'value' => json_encode([
                    'latitude' => (float) $validated['latitude'],
                    'longitude' => (float) $validated['longitude'],
                    'nama' => $validated['nama'] ?? 'Dapur Gabin',
                ]),
                'updated_at' => now(),
            ],
        );

        return response()->json(['ok' => true]);
    }

    private function getDapur(): ?array
    {
        $row = DB::table('settings')->where('key', 'dapur')->first();

        return $row ? json_decode($row->value, true) : null;
    }
}
