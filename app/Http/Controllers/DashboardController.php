<?php

namespace App\Http\Controllers;

use App\Models\BahanBaku;
use App\Models\Produk;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Dashboard utama: ringkasan cuan, tren penjualan per batch pre-order,
 * dan peringatan stok menipis.
 *
 * Semua angka dihitung dengan 4 query agregat (bukan per-row) supaya
 * tetap cepat meski koneksi DB ber-latensi tinggi (±90ms/query).
 */
class DashboardController extends Controller
{
    public function index(): Response
    {
        // Basis serah terima, konsisten dengan laporan laba rugi: pendapatan
        // hanya penjualan yang sudah diberikan.
        $delivered = "(pj.status_penyerahan = 'sudah_diberikan' OR pj.tanggal_diberikan IS NOT NULL)";

        // 1. Tren per batch PO: omzet (semua trx), pendapatan & HPP (trx
        //    diserahkan saja), jumlah transaksi. Satu query dengan agregat
        //    bersyarat.
        $batchTrend = DB::table('pre_orders as po')
            ->leftJoin('penjualans as pj', 'pj.pre_order_id', '=', 'po.id')
            ->leftJoin('detail_penjualans as dp', function ($join) {
                $join->on('dp.penjualan_id', '=', 'pj.id')
                    ->where(function ($q) {
                        $q->where('pj.status_penyerahan', 'sudah_diberikan')
                            ->orWhereNotNull('pj.tanggal_diberikan');
                    });
            })
            ->leftJoin('produks as pr', 'pr.id', '=', 'dp.produk_id')
            ->groupBy('po.id', 'po.kode', 'po.status')
            ->orderByDesc('po.id')
            ->limit(6)
            ->get([
                'po.id',
                'po.kode',
                'po.status',
                DB::raw('COUNT(pj.id) as trx'),
                DB::raw('COALESCE(SUM(pj.total), 0) as omzet'),
                DB::raw("COALESCE(SUM(CASE WHEN $delivered THEN pj.total ELSE 0 END), 0) as pendapatan"),
                DB::raw('COALESCE(SUM(dp.qty * pr.hpp), 0) as hpp'),
            ])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'kode' => $row->kode,
                'status' => $row->status,
                'trx' => (int) $row->trx,
                'omzet' => (float) $row->omzet,
                'pendapatan' => (float) $row->pendapatan,
                'laba' => round((float) $row->pendapatan - (float) $row->hpp, 2),
            ])
            ->all();

        // 2. Ringkasan cuan seluruh waktu (basis serah terima). Dua query.
        $totalPendapatan = (float) DB::table('penjualans as pj')
            ->whereRaw($delivered)
            ->sum('total');

        $totalHpp = (float) DB::table('detail_penjualans as dp')
            ->join('penjualans as pj', 'pj.id', '=', 'dp.penjualan_id')
            ->whereRaw($delivered)
            ->sum(DB::raw('dp.qty * (SELECT produks.hpp FROM produks WHERE produks.id = dp.produk_id)'));

        $laba = round($totalPendapatan - $totalHpp, 2);

        // 3. Stok menipis: 5 terkecil tiap kategori. Dua query.
        $lowStockBahan = BahanBaku::query()
            ->orderBy('stok')
            ->limit(5)
            ->get(['id', 'kode', 'nama_bahan', 'stok', 'satuan'])
            ->map(fn ($b) => [
                'id' => $b->id,
                'kode' => $b->kode,
                'nama' => $b->nama_bahan,
                'stok' => (float) $b->stok,
                'satuan' => $b->satuan,
            ])
            ->all();

        $lowStockProduk = Produk::query()
            ->orderBy('stok')
            ->limit(5)
            ->get(['id', 'kode', 'nama_produk', 'stok', 'satuan'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'kode' => $p->kode,
                'nama' => $p->nama_produk,
                'stok' => (float) $p->stok,
                'satuan' => $p->satuan,
            ])
            ->all();

        // 4. Produk terlaris (qty & omzet, basis serah terima). Satu query.
        $topProduk = DB::table('detail_penjualans as dp')
            ->join('penjualans as pj', 'pj.id', '=', 'dp.penjualan_id')
            ->join('produks as pr', 'pr.id', '=', 'dp.produk_id')
            ->whereRaw($delivered)
            ->groupBy('pr.id', 'pr.nama_produk')
            ->orderByDesc(DB::raw('SUM(dp.qty)'))
            ->limit(5)
            ->get([
                'pr.id',
                'pr.nama_produk',
                DB::raw('SUM(dp.qty) as qty'),
                DB::raw('SUM(dp.subtotal) as omzet'),
            ])
            ->map(fn ($row) => [
                'nama' => $row->nama_produk,
                'qty' => (int) $row->qty,
                'omzet' => (float) $row->omzet,
            ])
            ->all();

        return Inertia::render('Dashboard/Index', [
            'batchTrend' => $batchTrend,
            'summary' => [
                'pendapatan' => $totalPendapatan,
                'hpp' => $totalHpp,
                'laba' => $laba,
                'margin' => $totalPendapatan > 0
                    ? round(($laba / $totalPendapatan) * 100, 1)
                    : 0.0,
            ],
            'lowStockBahan' => $lowStockBahan,
            'lowStockProduk' => $lowStockProduk,
            'topProduk' => $topProduk,
        ]);
    }
}
