<?php

namespace App\Http\Controllers;

use App\Models\Produksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Dashboard versi ringan (efficiency first, ~4 query):
 * berisi kartu yang mengarah ke detail pemakaian bahan per batch produksi,
 * plus alerting kecukupan bahan untuk pesanan yang belum diserahkan.
 */
class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // 1. Batch produksi terbaru — kartu pintasan ke detail pemakaian bahan.
        //    Satu query: detail bahan diambil lewat subquery count/sum.
        $productionBatches = Produksi::query()
            ->with('produk:id,kode,nama_produk,satuan')
            ->withCount('pemakaianBahans')
            ->withSum('pemakaianBahans as total_bahan_dipakai', 'qty_bahan_dipakai')
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->limit(6)
            ->get()
            ->map(fn (Produksi $batch) => [
                'id'         => $batch->id,
                'tanggal'    => $batch->tanggal,
                'qty_hasil'  => (int) $batch->qty_hasil,
                'keterangan' => $batch->keterangan,
                'produk'     => $batch->produk ? [
                    'nama_produk' => $batch->produk->nama_produk,
                    'satuan'      => $batch->produk->satuan,
                ] : null,
                'jenis_bahan'        => (int) $batch->pemakaian_bahans_count,
                'total_bahan_dipakai' => (int) ($batch->total_bahan_dipakai ?? 0),
            ]);

        // 2. Alerting kecukupan bahan: stok bahan vs kebutuhan untuk
        //    semua pesanan yang belum diserahan — satu query GROUP BY
        //    (detail_penjualans × reseps), tanpa loop N+1.
        $alerts = DB::table('detail_penjualans as dp')
            ->join('penjualans as pj', 'pj.id', '=', 'dp.penjualan_id')
            ->join('reseps as r', 'r.produk_id', '=', 'dp.produk_id')
            ->join('bahan_bakus as bb', 'bb.id', '=', 'r.bahan_baku_id')
            ->whereNotIn('pj.status', ['selesai'])
            ->groupBy('bb.id', 'bb.nama_bahan', 'bb.stok', 'bb.satuan')
            ->havingRaw('SUM(dp.qty * r.qty) > bb.stok')
            ->select(
                'bb.id as id',
                'bb.nama_bahan as nama',
                'bb.stok as stok',
                'bb.satuan as satuan',
                DB::raw('SUM(dp.qty * r.qty) as dibutuhkan')
            )
            ->orderByDesc(DB::raw('SUM(dp.qty * r.qty) - bb.stok'))
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'id'         => (int) $row->id,
                'nama'       => $row->nama,
                'satuan'     => $row->satuan,
                'stok'       => (float) $row->stok,
                'dibutuhkan' => (float) $row->dibutuhkan,
                'kurang'     => (float) max(0, $row->dibutuhkan - $row->stok),
            ]);

        // 3. Ringkasan kecil untuk header dashboard.
        $pesananBelumDiserahkan = DB::table('penjualans')
            ->where('status_penyerahan', 'belum_diberikan')
            ->count();

        $bahanKurang = $alerts->count();

        return Inertia::render('dashboard', [
            'productionBatches' => $productionBatches,
            'alerts' => $alerts,
            'metrics' => [
                'pesananBelumDiserahkan' => $pesananBelumDiserahkan,
                'bahanKurang' => $bahanKurang,
            ],
        ]);
    }
}
