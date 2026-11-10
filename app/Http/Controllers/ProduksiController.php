<?php

namespace App\Http\Controllers;

use App\Models\PreOrder;
use App\Models\Produksi;
use App\Models\Produk;
use App\Models\BahanBaku;
use App\Models\Resep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class ProduksiController extends Controller
{
    public function index(Request $request)
    {
        $productions = Produksi::with(['produk', 'pemakaianBahans.bahanBaku'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::now()->endOfMonth()->toDateString();

        $totalHasilBulanIni = Produksi::whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->sum('qty_hasil');

        $totalTransaksiBulanIni = Produksi::whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->count();

        // Kartu kebutuhan produksi: total pcs per varian produk yang masih
        // harus dibuat untuk batch tertentu — dihitung dari qty produk pada
        // pre-order pelanggan yang belum diserahan. Satu query GROUP BY.
        $batches = PreOrder::orderByDesc('tanggal_mulai')
            ->get(['id', 'kode', 'keterangan', 'status']);

        $selectedBatchId = $request->filled('pre_order_id')
            ? (int) $request->input('pre_order_id')
            : PreOrder::where('status', 'buka')->orderByDesc('tanggal_mulai')->value('id');

        $productionNeeds = [];
        if ($selectedBatchId) {
            $productionNeeds = DB::table('detail_penjualans as dp')
                ->join('penjualans as pj', 'pj.id', '=', 'dp.penjualan_id')
                ->join('produks as pr', 'pr.id', '=', 'dp.produk_id')
                ->where('pj.pre_order_id', $selectedBatchId)
                ->where('pj.status_penyerahan', 'belum_diberikan')
                ->groupBy('pr.id', 'pr.kode', 'pr.nama_produk', 'pr.satuan')
                ->orderByDesc(DB::raw('SUM(dp.qty)'))
                ->get([
                    'pr.id as produk_id',
                    'pr.kode as produk_kode',
                    'pr.nama_produk as nama_produk',
                    'pr.satuan as satuan',
                    DB::raw('SUM(dp.qty) as total_pcs'),
                    DB::raw('COUNT(DISTINCT pj.id) as jumlah_pesanan'),
                ])
                ->map(fn ($row) => [
                    'produk_id' => (int) $row->produk_id,
                    'produk_kode' => $row->produk_kode,
                    'nama_produk' => $row->nama_produk,
                    'satuan' => $row->satuan,
                    'total_pcs' => (int) $row->total_pcs,
                    'jumlah_pesanan' => (int) $row->jumlah_pesanan,
                ])
                ->values()
                ->all();
        }

        // Estimasi produksi: berapa bungkus tiap produk masih bisa dibuat
        // dari stok bahan saat ini = MIN per bahan resep
        // (floor(stok_bahan / qty_resep)). Bahan yang habis paling cepat
        // ditampilkan sebagai pembatas.
        $bahanStok = BahanBaku::get()->keyBy('id');
        $recipes = DB::table('reseps')
            ->select('produk_id', 'bahan_baku_id', 'qty')
            ->get()
            ->groupBy('produk_id');

        $productionCapacity = [];
        foreach (Produk::orderBy('kode')->get(['id', 'kode', 'nama_produk', 'satuan']) as $p) {
            $resep = $recipes->get($p->id) ?? collect();
            if ($resep->isEmpty()) {
                continue;
            }

            $kapasitas = null;
            $bahanPembatas = null;
            foreach ($resep as $row) {
                $bahan = $bahanStok->get($row->bahan_baku_id);
                if (! $bahan || (float) $row->qty <= 0) {
                    continue;
                }
                $max = floor((float) $bahan->stok / (float) $row->qty);
                $kapasitas = $kapasitas === null ? $max : min($kapasitas, $max);
                if ($bahanPembatas === null || $max < $bahanPembatas['max_tercapai']) {
                    $bahanPembatas = [
                        'nama' => $bahan->nama_bahan,
                        'satuan' => $bahan->satuan,
                        'sisa_stok' => (float) $bahan->stok,
                        'max_tercapai' => $max,
                    ];
                }
            }

            if ($kapasitas !== null) {
                $productionCapacity[] = [
                    'produk_id' => $p->id,
                    'produk_kode' => $p->kode,
                    'nama_produk' => $p->nama_produk,
                    'satuan' => $p->satuan,
                    'kapasitas' => max($kapasitas, 0),
                    'bahan_pembatas' => $bahanPembatas,
                ];
            }
        }

        return Inertia::render('Production/Index', [
            'productions' => $productions,
            'metrics' => [
                'totalHasilBulanIni' => $totalHasilBulanIni,
                'totalTransaksiBulanIni' => $totalTransaksiBulanIni,
            ],
            'productionNeeds' => $productionNeeds,
            'productionCapacity' => $productionCapacity,
            'batches' => $batches,
            'selectedBatchId' => $selectedBatchId,
        ]);
    }

    public function create()
    {
        return Inertia::render('Production/Create', [
            'products' => Produk::orderBy('kode', 'asc')->get(),
            'bahanBakus' => BahanBaku::orderBy('kode', 'asc')->get(),
            'recipes' => Resep::orderBy('produk_id')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => 'required|date',
            'produk_id' => 'required|exists:produks,id',
            'qty_hasil' => 'required|integer|min:1',
            'keterangan' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'items.*.qty_bahan_dipakai' => 'required|numeric|min:0.001', // dari qty resep, boleh koma
        ]);

        // --- VALIDASI STOK BAHAN BAKU SEBELUM TRANSAKSI ---
        $errors = [];
        foreach ($validated['items'] as $item) {
            $bahanBaku = BahanBaku::findOrFail($item['bahan_baku_id']);
            if ($item['qty_bahan_dipakai'] > $bahanBaku->stok) {
                $errors[] = "Stok bahan baku \"{$bahanBaku->nama_bahan}\" tidak mencukupi. "
                    . "Dibutuhkan: {$item['qty_bahan_dipakai']} {$bahanBaku->satuan}, "
                    . "Sisa stok: {$bahanBaku->stok} {$bahanBaku->satuan}.";
            }
        }
        if (!empty($errors)) {
            return back()->withErrors(['items' => $errors])->withInput();
        }
        // ---------------------------------------------------

        DB::transaction(function () use ($validated) {
            // 1. Simpan Header Produksi
            $produksi = Produksi::create([
                'tanggal' => $validated['tanggal'],
                'produk_id' => $validated['produk_id'],
                'qty_hasil' => $validated['qty_hasil'],
                'keterangan' => $validated['keterangan'] ?? '',
            ]);

            // 2. Looping Items Pemakaian Bahan
            foreach ($validated['items'] as $item) {
                $bahanBaku = BahanBaku::findOrFail($item['bahan_baku_id']);

                $produksi->pemakaianBahans()->create([
                    'bahan_baku_id' => $item['bahan_baku_id'],
                    'qty_bahan_dipakai' => $item['qty_bahan_dipakai'],
                ]);

                // Kurangi stok bahan mentah
                $bahanBaku->decrement('stok', $item['qty_bahan_dipakai']);
            }

            // 3. Tambah stok produk jadi
            $produk = Produk::findOrFail($validated['produk_id']);
            $produk->increment('stok', $validated['qty_hasil']);
        });

        return redirect()->route('productions.index')->with('success', 'Transaksi Produksi Berhasil Dicatat.');
    }

    public function usage(Produksi $production)
    {
        // Satu eager-load: pemakaian bahan per batch + stok bahan terkini,
        // untuk membandingkan kecukupan stok vs qty yang dipakai.
        $production->load([
            'produk:id,kode,nama_produk,satuan',
            'pemakaianBahans' => fn ($q) => $q->orderBy('id'),
            'pemakaianBahans.bahanBaku:id,kode,nama_bahan,satuan,stok',
        ]);

        return Inertia::render('Production/Usage', [
            'batch' => [
                'id'         => $production->id,
                'tanggal'    => $production->tanggal,
                'qty_hasil'  => (int) $production->qty_hasil,
                'keterangan' => $production->keterangan,
                'produk'     => $production->produk ? [
                    'nama_produk' => $production->produk->nama_produk,
                    'satuan'      => $production->produk->satuan,
                ] : null,
            ],
            'usage' => $production->pemakaianBahans->map(fn ($row) => [
                'bahan_id'     => $row->bahan_baku_id,
                'nama_bahan'   => $row->bahanBaku?->nama_bahan,
                'kode_bahan'   => $row->bahanBaku?->kode,
                'satuan'       => $row->bahanBaku?->satuan,
                'qty_dipakai'  => (float) $row->qty_bahan_dipakai,
                'stok_sekarang' => (float) ($row->bahanBaku?->stok ?? 0),
            ]),
        ]);
    }

    public function destroy(Produksi $production)
    {
        DB::transaction(function () use ($production) {
            // 1. Kembalikan stok bahan baku
            foreach ($production->pemakaianBahans as $detail) {
                $detail->bahanBaku->increment('stok', $detail->qty_bahan_dipakai);
            }

            // 2. Kurangi stok produk jadi
            $production->produk->decrement('stok', $production->qty_hasil);

            // 3. Hapus data produksi (cascade delete akan menghapus pemakaian_bahans)
            $production->delete();
        });

        return redirect()->route('productions.index')->with('success', 'Transaksi Produksi berhasil dihapus dan stok telah dikembalikan.');
    }
}
