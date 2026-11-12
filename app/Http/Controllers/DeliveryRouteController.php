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
            'url' => 'required|url|max:2048',
        ]);

        $url = $validated['url'];

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

        // 3. URL final tak berkoordinat (place link): cari koordinat di body
        $body = $res->body();
        if (preg_match('/(-?\d{1,2}\.\d{4,})\s*,\s*(-?\d{1,3}\.\d{4,})/', $body, $m)) {
            $lat = (float) $m[1];
            $lng = (float) $m[2];
            if (abs($lat) <= 90 && abs($lng) <= 180 && ($lat != 0 || $lng != 0)) {
                return response()->json(['titik' => ['lat' => $lat, 'lng' => $lng]]);
            }
        }

        return response()->json(['titik' => null]);
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
