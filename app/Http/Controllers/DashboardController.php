<?php

namespace App\Http\Controllers;

use App\Models\BahanBaku;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Halaman Dashboard baru (ringkas & cepat):
 *   1. Terjual seumur hidup per produk (qty) + yang belum diserahkan.
 *   2. Estimasi produksi yang masih bisa dibuat per produk,
 *      dihitung dari stok bahan mutakhir ÷ qty resep per bahan.
 */
class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // 1. Qty terjual seumur hidup per produk.
        //    "Terjual" = pesanan yang benar-benar sudah diserahkan ke pembeli,
        //    sesuai alur stok: pesanan masuk tidak mengubah stok,
        //    produksi menambah stok, serah terima mengurangi stok.
        $terjual = DB::table('detail_penjualans as dp')
            ->join('penjualans as pj', 'pj.id', '=', 'dp.penjualan_id')
            ->where(function ($q) {
                $q->whereNotNull('pj.tanggal_diberikan')
                    ->orWhere('pj.status_penyerahan', 'sudah_diberikan');
            })
            ->groupBy('dp.produk_id')
            ->select('dp.produk_id', DB::raw('SUM(dp.qty) as total'))
            ->pluck('total', 'produk_id');

        // Pesanan yang sudah dibayar/dicatat tapi belum diserahkan
        // (masih menunggu produksi).
        $belumDiserahkan = DB::table('detail_penjualans as dp')
            ->join('penjualans as pj', 'pj.id', '=', 'dp.penjualan_id')
            ->whereNull('pj.tanggal_diberikan')
            ->where('pj.status_penyerahan', 'belum_diberikan')
            ->groupBy('dp.produk_id')
            ->select('dp.produk_id', DB::raw('SUM(dp.qty) as total'))
            ->pluck('total', 'produk_id');

        // 2. Estimasi produksi: berapa produk yang masih bisa dibuat
        //    dengan bahan yang ada sekarang = MIN per bahan resep
        //    (floor(stok_bahan / qty_resep)).
        $bahanStok = BahanBaku::orderBy('kode')->get()->keyBy('id');

        $recipes = DB::table('reseps')
            ->select('produk_id', 'bahan_baku_id', 'qty')
            ->get()
            ->groupBy('produk_id');

        $produkList = Produk::orderBy('kode', 'asc')->get();

        $productRows = $produkList->map(function (Produk $p) use ($terjual, $belumDiserahkan, $recipes, $bahanStok) {
            $resep = $recipes->get($p->id) ?? collect();

            // Batas produksi = bahan resep yang paling cepat habis,
            // dibulatkan ke bawah (harus utuh per pcs bungkus).
            $kapasitas = null;
            $bahanHabis = null;
            if ($resep->isNotEmpty()) {
                foreach ($resep as $row) {
                    $bahan = $bahanStok->get($row->bahan_baku_id);
                    if (! $bahan || (float) $row->qty <= 0) {
                        continue;
                    }
                    $max = floor((float) $bahan->stok / (float) $row->qty);
                    $kapasitas = $kapasitas === null ? $max : min($kapasitas, $max);
                    if ($max < ($bahanHabis['max'] ?? PHP_INT_MAX)) {
                        $bahanHabis = [
                            'nama' => $bahan->nama_bahan,
                            'satuan' => $bahan->satuan,
                            'max' => $max,
                        ];
                    }
                }
            }

            return [
                'id' => $p->id,
                'kode' => $p->kode,
                'nama_produk' => $p->nama_produk,
                'satuan' => $p->satuan,
                'stok_saat_ini' => (float) $p->stok,
                'terjual_seumur_hidup' => (float) ($terjual[$p->id] ?? 0),
                'belum_diserahkan' => (float) ($belumDiserahkan[$p->id] ?? 0),
                'estimasi_produksi' => ($resep->isNotEmpty() && $kapasitas !== null) ? max($kapasitas, 0) : null,
                'bahan_pembatas' => ($resep->isNotEmpty() && $kapasitas !== null && $bahanHabis !== null) ? $bahanHabis : null,
            ];
        });

        return Inertia::render('Dashboard', [
            'products' => $productRows,
            'summary' => [
                'totalTerjual' => (float) $productRows->sum('terjual_seumur_hidup'),
                'totalStokProduk' => (float) $productRows->sum('stok_saat_ini'),
                'totalKapasitas' => (float) $productRows->filter(fn ($r) => $r['estimasi_produksi'] !== null)->sum('estimasi_produksi'),
            ],
        ]);
    }
}
