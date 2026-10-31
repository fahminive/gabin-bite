<?php

namespace App\Http\Controllers;

use App\Models\BahanBaku;
use App\Models\Kas;
use App\Models\Modal;
use App\Models\Pembelian;
use App\Models\PengeluaranOperasional;
use App\Models\Penjualan;
use App\Models\Peralatan;
use App\Models\PreOrder;
use App\Models\Produk;
use App\Services\SplitBillService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request, SplitBillService $splitBill)
    {
        $preOrderId = $request->input('pre_order_id');
        $template = $request->input('timeline_template', '30_days');

        switch ($template) {
            case 'week':
                $startDate = Carbon::now()->startOfWeek()->toDateString();
                $endDate = Carbon::now()->endOfWeek()->toDateString();
                break;
            case 'month':
                $startDate = Carbon::now()->startOfMonth()->toDateString();
                $endDate = Carbon::now()->endOfMonth()->toDateString();
                break;
            case 'year':
                $startDate = Carbon::now()->startOfYear()->toDateString();
                $endDate = Carbon::now()->endOfYear()->toDateString();
                break;
            case 'custom':
                $startDate = $request->input('start_date', Carbon::now()->subDays(30)->toDateString());
                $endDate = $request->input('end_date', Carbon::now()->toDateString());
                break;
            case '30_days':
            default:
                $startDate = Carbon::now()->subDays(30)->toDateString();
                $endDate = Carbon::now()->toDateString();
                break;
        }

        $startDateObj = Carbon::parse($startDate);
        $endDateObj = Carbon::parse($endDate);

        // ====================================================================
        // HELPER: beberapa baris kas di Supabase memiliki tanggal = NULL.
        // Fallback ke DATE(created_at) agar data tetap terhitung.
        // ====================================================================
        $kasTanggalExpr = "(COALESCE(\"tanggal\", DATE(\"created_at\")))";
        $kasWhereRange = "{$kasTanggalExpr} BETWEEN ? AND ?";
        $kasWhereOnOrBefore = "{$kasTanggalExpr} <= ?";

        // 1. Saldo Kas Akhir Periode (1 query, conditional aggregation)
        $kasAgregat = Kas::whereRaw($kasWhereRange, [$startDate, $endDate])
            ->selectRaw(
                "SUM(CASE WHEN \"masuk\" > 0 THEN \"masuk\" ELSE 0 END) as total_masuk,
                 SUM(CASE WHEN \"keluar\" > 0 THEN \"keluar\" ELSE 0 END) as total_keluar"
            )
            ->first();

        $totalInflow = (float) ($kasAgregat->total_masuk ?? 0);
        $totalOutflow = (float) ($kasAgregat->total_keluar ?? 0);
        $netCashFlow = $totalInflow - $totalOutflow;

        // Saldo kas sampai akhir periode (untuk neraca mini)
        $kasSaldoAkhir = Kas::whereRaw($kasWhereOnOrBefore, [$endDate])
            ->selectRaw(
                "SUM(CASE WHEN \"masuk\" > 0 THEN \"masuk\" ELSE 0 END) -
                 SUM(CASE WHEN \"keluar\" > 0 THEN \"keluar\" ELSE 0 END) as saldo"
            )
            ->value('saldo') ?? 0.0;
        $saldoKas = (float) $kasSaldoAkhir;

        // Build query scope untuk transaksi dalam rentang tanggal
        $dateRangeWhere = [DB::raw("DATE(\"created_at\") BETWEEN ? AND ?"), $startDate, $endDate];
        $dateRangeOnOrBefore = [DB::raw("DATE(\"created_at\") <= ?"), $endDate];

        if ($preOrderId) {
            $dateRangeWhere[0] .= " AND \"pre_order_id\" = ?";
            $dateRangeWhere[] = $preOrderId;
        }

        // 2. Pendapatan, HPP, Operasional, Pembelian
        $pendapatan = (float) Penjualan::where($dateRangeWhere[0], ...array_slice($dateRangeWhere, 1))
            ->sum('total');

        $hpp = (float) DB::table('detail_penjualans')
            ->join('penjualans', 'detail_penjualans.penjualan_id', '=', 'penjualans.id')
            ->join('produks', 'detail_penjualans.produk_id', '=', 'produks.id')
            ->where($dateRangeWhere[0], ...array_slice($dateRangeWhere, 1))
            ->sum(DB::raw('detail_penjualans.qty * produks.hpp'));

        $labaKotor = $pendapatan - $hpp;

        $operasional = (float) PengeluaranOperasional::where($dateRangeWhere[0], ...array_slice($dateRangeWhere, 1))
            ->sum('nominal');

        $pembelianBahan = (float) Pembelian::where($dateRangeWhere[0], ...array_slice($dateRangeWhere, 1))
            ->sum('total');

        $labaBersih = $labaKotor - $operasional;

        $preOrderAktif = (float) Penjualan::where('status', '!=', 'selesai')
            ->where($dateRangeWhere[0], ...array_slice($dateRangeWhere, 1))
            ->sum('total');

        // 3. Tren Pendapatan Harian (Line Chart) — 1 query SQL langsung
        $dailyRevenueRaw = Penjualan::where($dateRangeWhere[0], ...array_slice($dateRangeWhere, 1))
            ->select(DB::raw('DATE("created_at") as date'), DB::raw('SUM(total) as total'))
            ->groupBy('date')
            ->pluck('total', 'date')
            ->toArray();

        $incomeTrend = [];
        for ($date = $startDateObj->copy(); $date->lte($endDateObj); $date->addDay()) {
            $formattedDate = $date->toDateString();
            $incomeTrend[] = [
                'name' => $date->translatedFormat('d M'),
                'amount' => (float) ($dailyRevenueRaw[$formattedDate] ?? 0),
            ];
        }

        // 4. Grafik Arus Kas Harian (Double-Sided Bar Chart) — 1 query SQL langsung
        $dailyCashRaw = Kas::whereRaw($kasWhereRange, [$startDate, $endDate])
            ->select($kasTanggalExpr . ' as tanggal',
                DB::raw('SUM(CASE WHEN "masuk" > 0 THEN "masuk" ELSE 0 END) as total_masuk'),
                DB::raw('SUM(CASE WHEN "keluar" > 0 THEN "keluar" ELSE 0 END) as total_keluar'))
            ->groupBy('tanggal')
            ->get()
            ->keyBy('tanggal')
            ->toArray();

        $cashFlowTrend = [];
        for ($date = $startDateObj->copy(); $date->lte($endDateObj); $date->addDay()) {
            $formattedDate = $date->toDateString();
            $dayData = $dailyCashRaw[$formattedDate] ?? null;
            $inflow = (float) ($dayData['total_masuk'] ?? 0);
            $outflow = (float) ($dayData['total_keluar'] ?? 0);
            $cashFlowTrend[] = [
                'name' => $date->translatedFormat('d M'),
                'inflow' => $inflow,
                'outflow' => -$outflow,
                'net' => $inflow - $outflow,
            ];
        }

        // 5. Pengeluaran Terbesar (Outflow Categories) — 1 query
        $outflowBreakdown = Kas::whereRaw($kasWhereRange, [$startDate, $endDate])
            ->where('keluar', '>', 0)
            ->selectRaw('"sumber", SUM("keluar") as total')
            ->groupBy('sumber')
            ->get()
            ->map(function ($item) {
                $labels = [
                    'pembelian' => 'Pembelian Bahan',
                    'hutang' => 'Cicilan Hutang',
                    'operasional' => 'Biaya Operasional',
                    'peralatan' => 'Peralatan & Mesin',
                    'lainnya' => 'Lain-lain',
                ];
                return [
                    'name' => $labels[$item->sumber] ?? ucfirst($item->sumber),
                    'value' => (float) $item->total,
                ];
            })
            ->values()
            ->toArray();

        $cashFlowComparison = [
            ['name' => 'Pendapatan', 'value' => $totalInflow],
            ['name' => 'Pengeluaran', 'value' => $totalOutflow],
            ['name' => 'Sisa', 'value' => max(0, $netCashFlow)],
        ];

        // 6. Efisiensi Manufaktur
        $produksiHpp = (float) DB::table('produksis')
            ->join('produks', 'produksis.produk_id', '=', 'produks.id')
            ->whereBetween('produksis.tanggal', [$startDate, $endDate])
            ->sum(DB::raw('produksis.qty_hasil * produks.hpp'));

        $bahanBakuDipakaiCost = (float) DB::table('pemakaian_bahans')
            ->join('produksis', 'pemakaian_bahans.produksi_id', '=', 'produksis.id')
            ->join('bahan_bakus', 'pemakaian_bahans.bahan_baku_id', '=', 'bahan_bakus.id')
            ->whereBetween('produksis.tanggal', [$startDate, $endDate])
            ->sum(DB::raw('pemakaian_bahans.qty_bahan_dipakai * bahan_bakus.harga_satuan'));

        $manufacturingEfficiency = [
            'produksiHpp' => $produksiHpp,
            'bahanBakuDipakaiCost' => $bahanBakuDipakaiCost,
        ];

        // 7. Neraca Mini (Harta/Aset vs Kewajiban & Ekuitas)
        $persediaanBahan = (float) BahanBaku::sum(DB::raw('"stok" * "harga_satuan"'));
        $persediaanProduk = (float) Produk::sum(DB::raw('"stok" * "hpp"'));
        $totalAsetLancar = $saldoKas + $persediaanBahan + $persediaanProduk;
        $peralatan = (float) Peralatan::where('tgl_beli', '<=', $endDate)->sum('harga_perolehan');
        $totalAset = $totalAsetLancar + $peralatan;

        $modal = (float) Modal::where($dateRangeOnOrBefore[0], ...array_slice($dateRangeOnOrBefore, 1))
            ->sum('nominal');

        $pendapatanKumulatif = (float) Penjualan::where($dateRangeOnOrBefore[0], ...array_slice($dateRangeOnOrBefore, 1))
            ->sum('total');

        $hppKumulatif = (float) DB::table('detail_penjualans')
            ->join('penjualans', 'detail_penjualans.penjualan_id', '=', 'penjualans.id')
            ->join('produks', 'detail_penjualans.produk_id', '=', 'produks.id')
            ->where($dateRangeOnOrBefore[0], ...array_slice($dateRangeOnOrBefore, 1))
            ->sum(DB::raw('detail_penjualans.qty * produks.hpp'));

        $operasionalKumulatif = (float) PengeluaranOperasional::where($dateRangeOnOrBefore[0], ...array_slice($dateRangeOnOrBefore, 1))
            ->sum('nominal');

        $labaDitahan = (float) ($pendapatanKumulatif - $hppKumulatif - $operasionalKumulatif);
        $totalEkuitas = $modal + $labaDitahan;

        $miniBalanceSheet = [
            'totalAset' => $totalAset,
            'kewajiban' => 0.0,
            'ekuitas' => $totalEkuitas,
            'totalPasiva' => $totalEkuitas,
        ];

        // 8. Pelanggan & Pemasok Teratas (Top Partners) — limit 3
        $topCustomers = DB::table('penjualans')
            ->join('pelanggans', 'penjualans.pelanggan_id', '=', 'pelanggans.id')
            ->where($dateRangeWhere[0], ...array_slice($dateRangeWhere, 1))
            ->select('pelanggans.nama_pelanggan as nama', DB::raw('SUM(penjualans.total) as total_amount'))
            ->groupBy('pelanggans.id', 'pelanggans.nama_pelanggan')
            ->orderByDesc('total_amount')
            ->limit(3)
            ->get();

        $topSuppliers = DB::table('pembelians')
            ->join('pemasoks', 'pembelians.pemasok_id', '=', 'pemasoks.id')
            ->where($dateRangeWhere[0], ...array_slice($dateRangeWhere, 1))
            ->select('pemasoks.nama_pemasok as nama', DB::raw('SUM(pembelians.total) as total_amount'))
            ->groupBy('pemasoks.id', 'pemasoks.nama_pemasok')
            ->orderByDesc('total_amount')
            ->limit(3)
            ->get();

        // 9. Produk Terlaris — limit 5
        $bestSellers = DB::table('detail_penjualans')
            ->join('penjualans', 'detail_penjualans.penjualan_id', '=', 'penjualans.id')
            ->join('produks', 'detail_penjualans.produk_id', '=', 'produks.id')
            ->where($dateRangeWhere[0], ...array_slice($dateRangeWhere, 1))
            ->select(
                'produks.nama_produk as nama',
                DB::raw('SUM(detail_penjualans.qty) as total_qty'),
                DB::raw('SUM(detail_penjualans.qty * detail_penjualans.harga_satuan) as total_revenue')
            )
            ->groupBy('produks.id', 'produks.nama_produk')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        // 10. Bahan Baku Kritis (stok < 10) — limit 5
        $criticalMaterials = BahanBaku::where('stok', '<', 10)
            ->orderBy('stok', 'asc')
            ->limit(5)
            ->get(['id', 'nama_bahan', 'stok', 'satuan'])
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'nama' => $item->nama_bahan,
                    'stok' => $item->stok,
                    'satuan' => $item->satuan,
                ];
            });

        $neededMaterials = $this->materialsNeededForOpenOrders();
        $partnerBalances = $splitBill->balances($preOrderId ? (int) $preOrderId : null);

        return Inertia::render('dashboard', [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'timelineTemplate' => $template,
            'preOrderId' => $preOrderId,
            'batches' => PreOrder::orderByDesc('created_at')->get(),
            'metrics' => [
                'saldoKas' => $saldoKas,
                'labaBersih' => $labaBersih,
                'preOrderAktif' => $preOrderAktif,
                'splitOutstanding' => collect($partnerBalances)->sum(fn ($row) => max(0, -$row['saldo'])),
                'pendapatan' => $pendapatan,
                'pengeluaran' => $operasional + $pembelianBahan,
                'pengeluaranBahan' => $pembelianBahan,
                'pengeluaranOperasional' => $operasional,
                'jumlahPesanan' => Penjualan::where($dateRangeWhere[0], ...array_slice($dateRangeWhere, 1))->count(),
                'jumlahPelanggan' => DB::table('pelanggans')->whereExists(function ($q) use ($preOrderId, $startDate, $endDate) {
                    $q->select(DB::raw(1))
                        ->from('penjualans')
                        ->whereColumn('penjualans.pelanggan_id', 'pelanggans.id')
                        ->whereBetween(DB::raw('DATE("created_at")'), [$startDate, $endDate]);
                    if ($preOrderId) {
                        $q->where('penjualans.pre_order_id', $preOrderId);
                    }
                })->count(),
            ],
            'incomeTrend' => $incomeTrend,
            'cashFlowTrend' => $cashFlowTrend,
            'outflowBreakdown' => $outflowBreakdown,
            'cashFlowComparison' => $cashFlowComparison,
            'labaRugiBreakdown' => [
                'pendapatan' => $pendapatan,
                'hpp' => $hpp,
                'operasional' => $operasional,
                'labaBersih' => $labaBersih,
            ],
            'manufacturingEfficiency' => $manufacturingEfficiency,
            'miniBalanceSheet' => $miniBalanceSheet,
            'topCustomers' => $topCustomers,
            'topSuppliers' => $topSuppliers,
            'bestSellers' => $bestSellers,
            'criticalMaterials' => $criticalMaterials,
            'neededMaterials' => $neededMaterials,
            'partnerBalances' => $partnerBalances,
        ]);
    }

    private function materialsNeededForOpenOrders(): array
    {
        $openOrders = Penjualan::with(['detailPenjualans.produk.reseps.bahanBaku'])
            ->where('status', '!=', 'selesai')
            ->get();

        $needed = [];

        foreach ($openOrders as $order) {
            foreach ($order->detailPenjualans as $detail) {
                foreach ($detail->produk?->reseps ?? [] as $resep) {
                    $bahan = $resep->bahanBaku;
                    if (! $bahan) {
                        continue;
                    }

                    $key = $bahan->id;
                    if (! isset($needed[$key])) {
                        $needed[$key] = [
                            'id' => $bahan->id,
                            'nama' => $bahan->nama_bahan,
                            'satuan' => $bahan->satuan,
                            'stok' => (float) $bahan->stok,
                            'dibutuhkan' => 0.0,
                        ];
                    }

                    $needed[$key]['dibutuhkan'] += $detail->qty * $resep->qty;
                }
            }
        }

        return collect($needed)
            ->map(function ($row) {
                $row['kurang'] = max(0, $row['dibutuhkan'] - $row['stok']);

                return $row;
            })
            ->filter(fn ($row) => $row['kurang'] > 0)
            ->sortByDesc('kurang')
            ->values()
            ->take(8)
            ->all();
    }
}
