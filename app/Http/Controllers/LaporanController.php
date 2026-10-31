<?php

namespace App\Http\Controllers;

use App\Models\BahanBaku;
use App\Models\Hutang;
use App\Models\Kas;
use App\Models\Modal;
use App\Models\Mitra;
use App\Models\PengeluaranOperasional;
use App\Models\Penjualan;
use App\Models\Peralatan;
use App\Models\Produk;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LaporanController extends Controller
{
    private function getAkumulasiPenyusutan($date)
    {
        $peralatans = Peralatan::where('tgl_beli', '<=', $date)->get();
        $totalDepreciation = 0;

        foreach ($peralatans as $alat) {
            if ($alat->persentase_penyusutan > 0) {
                $tglBeli = Carbon::parse($alat->tgl_beli);
                $targetDate = Carbon::parse($date);
                $months = $tglBeli->diffInMonths($targetDate);

                if ($months > 0) {
                    // Capping at 100% depreciation
                    $maxMonths = floor(100 / $alat->persentase_penyusutan);
                    if ($months > $maxMonths) {
                        $months = $maxMonths;
                    }

                    $depreciation = $alat->harga_perolehan * ($alat->persentase_penyusutan / 100) * $months;
                    $totalDepreciation += $depreciation;
                }
            }
        }

        return $totalDepreciation;
    }

    /**
     * Rentang tanggal default mengikuti data yang tersedia (min dan max tanggal
     * transaksi) sehingga laporan tidak menampilkan 0 meskipun data tidak ada
     * pada bulan ini. Jika keduanya sudah diisi oleh request, gunakan langsung.
     */
    private function resolveDefaultDateRange(Request $request): array
    {
        $start = $request->input('start_date');
        $end = $request->input('end_date');

        if ($start && $end) {
            return [$start, $end];
        }

        $bounds = [];
        foreach ([
            Kas::selectRaw('MIN(COALESCE(tanggal, DATE(created_at))) as mn, MAX(COALESCE(tanggal, DATE(created_at))) as mx')->first(),
            Penjualan::selectRaw('MIN(DATE(created_at)) as mn, MAX(DATE(created_at)) as mx')->first(),
            PengeluaranOperasional::selectRaw('MIN(tanggal) as mn, MAX(tanggal) as mx')->first(),
        ] as $row) {
            if ($row && $row->mn) {
                $bounds[] = $row->mn;
                $bounds[] = $row->mx;
            }
        }

        $now = Carbon::now();
        $defaultStart = $now->startOfMonth()->toDateString();
        $defaultEnd = $now->endOfMonth()->toDateString();

        if (! empty($bounds)) {
            $defaultStart = min($bounds);
            $defaultEnd = max($bounds);
        }

        return [
            $start ?? $defaultStart,
            $end ?? $defaultEnd,
        ];
    }

    /**
     * Beberapa baris kas di Supabase memiliki `tanggal = NULL` (disimpan tanpa
     * tanggal saat seeding/import awal), sehingga filter langsung pada kolom
     * `tanggal` akan mengembalikan nol. Fallback ke `DATE(created_at)` agar
     * transaksi tetap terhitung dalam laporan.
     */
    private function applyKasBefore($query, string $date)
    {
        return $query->whereRaw('(tanggal IS NOT NULL AND tanggal < ?) OR (tanggal IS NULL AND DATE(created_at) < ?)', [$date, $date]);
    }

    private function applyKasBetween($query, string $start, string $end)
    {
        return $query->whereRaw('(tanggal IS NOT NULL AND tanggal BETWEEN ? AND ?) OR (tanggal IS NULL AND DATE(created_at) BETWEEN ? AND ?)', [$start, $end, $start, $end]);
    }

    private function applyKasOnOrBefore($query, string $date)
    {
        return $query->whereRaw('(tanggal IS NOT NULL AND tanggal <= ?) OR (tanggal IS NULL AND DATE(created_at) <= ?)', [$date, $date]);
    }

    private function getCashFlowData(Request $request)
    {
        [$startDate, $endDate] = $this->resolveDefaultDateRange($request);

        // 1. Saldo Awal Kas
        $saldoAwal = $this->applyKasBefore(Kas::where('masuk', '>', 0), $startDate)->sum('masuk')
            - $this->applyKasBefore(Kas::where('keluar', '>', 0), $startDate)->sum('keluar');

        // 2. Arus Kas Masuk
        $inflows = $this->applyKasBetween(Kas::where('masuk', '>', 0), $startDate, $endDate)
            ->selectRaw('sumber, SUM(masuk) as total')
            ->groupBy('sumber')
            ->get()
            ->pluck('total', 'sumber')
            ->toArray();

        // 3. Arus Kas Keluar
        $outflows = $this->applyKasBetween(Kas::where('keluar', '>', 0), $startDate, $endDate)
            ->selectRaw('sumber, SUM(keluar) as total')
            ->groupBy('sumber')
            ->get()
            ->pluck('total', 'sumber')
            ->toArray();

        // Ensure all possible sources are in arrays
        $sourcesIn = ['penjualan', 'piutang', 'modal', 'lainnya'];
        $sourcesOut = ['pembelian', 'hutang', 'operasional', 'peralatan', 'lainnya'];

        $formattedInflows = [];
        $totalInflow = 0;
        foreach ($sourcesIn as $src) {
            $val = (float) ($inflows[$src] ?? 0);
            $formattedInflows[$src] = $val;
            $totalInflow += $val;
        }

        $formattedOutflows = [];
        $totalOutflow = 0;
        foreach ($sourcesOut as $src) {
            $val = (float) ($outflows[$src] ?? 0);
            $formattedOutflows[$src] = $val;
            $totalOutflow += $val;
        }

        $saldoAkhir = $saldoAwal + $totalInflow - $totalOutflow;

        return [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'saldoAwal' => $saldoAwal,
            'inflows' => $formattedInflows,
            'outflows' => $formattedOutflows,
            'totalInflow' => $totalInflow,
            'totalOutflow' => $totalOutflow,
            'saldoAkhir' => $saldoAkhir,
        ];
    }

    public function cashFlow(Request $request)
    {
        return Inertia::render('Reports/CashFlow', $this->getCashFlowData($request));
    }

    public function cashFlowPdf(Request $request)
    {
        $data = $this->getCashFlowData($request);
        $pdf = Pdf::loadView('pdf.cash-flow', $data);

        return $pdf->download('Laporan_Arus_Kas_'.$data['startDate'].'_to_'.$data['endDate'].'.pdf');
    }

    private function getIncomeStatementData(Request $request)
    {
        [$startDate, $endDate] = $this->resolveDefaultDateRange($request);

        // 1. Pendapatan Penjualan
        $pendapatan = (float) Penjualan::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])->sum('total');

        // 2. Harga Pokok Penjualan (HPP)
        $hpp = (float) DB::table('detail_penjualans')
            ->join('penjualans', 'detail_penjualans.penjualan_id', '=', 'penjualans.id')
            ->join('produks', 'detail_penjualans.produk_id', '=', 'produks.id')
            ->whereBetween(DB::raw('DATE(penjualans.created_at)'), [$startDate, $endDate])
            ->sum(DB::raw('detail_penjualans.qty * produks.hpp'));

        // 3. Laba Kotor
        $labaKotor = $pendapatan - $hpp;

        // 4. Beban Operasional (Termasuk Rugi/Laba dari Koreksi Stok)
        $operasionalKas = (float) PengeluaranOperasional::whereBetween('tanggal', [$startDate, $endDate])->sum('nominal');

        $koreksiStokLoss = (float) DB::table('koreksi_stoks')
            ->join('produks', 'koreksi_stoks.produk_id', '=', 'produks.id')
            ->where('koreksi_stoks.jenis_koreksi', 'keluar')
            ->whereBetween(DB::raw('DATE(koreksi_stoks.created_at)'), [$startDate, $endDate])
            ->sum(DB::raw('koreksi_stoks.qty * produks.hpp'));

        $koreksiStokGain = (float) DB::table('koreksi_stoks')
            ->join('produks', 'koreksi_stoks.produk_id', '=', 'produks.id')
            ->where('koreksi_stoks.jenis_koreksi', 'masuk')
            ->whereBetween(DB::raw('DATE(koreksi_stoks.created_at)'), [$startDate, $endDate])
            ->sum(DB::raw('koreksi_stoks.qty * produks.hpp'));

        $bebanPenyusutan = $this->getAkumulasiPenyusutan($endDate) - $this->getAkumulasiPenyusutan($startDate);

        $operasional = $operasionalKas + $koreksiStokLoss - $koreksiStokGain + $bebanPenyusutan;

        $labaBersihSebelumPajak = $labaKotor - $operasional;
        $bebanPajak = 0;
        $labaBersihSetelahPajak = $labaBersihSebelumPajak;

        // Pembagian laba bersih per partner (3 orang): masing-masing menerima 1/3.
        Mitra::ensureTrio();
        $mitras = Mitra::orderBy('kode')->get();
        $partnerCount = max($mitras->count(), 1);
        $labaPerOrang = (float) $labaBersihSetelahPajak / $partnerCount;
        $profitSharing = $mitras->map(function ($mitra) use ($labaPerOrang) {
            return [
                'id' => $mitra->id,
                'nama' => $mitra->nama,
                'kode' => $mitra->kode,
                'share' => $labaPerOrang,
            ];
        })->all();

        return [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'pendapatan' => $pendapatan,
            'hpp' => $hpp,
            'labaKotor' => $labaKotor,
            'operasional' => $operasional,
            'operasionalDetail' => [
                'kas' => $operasionalKas,
                'koreksiStokLoss' => $koreksiStokLoss,
                'koreksiStokGain' => $koreksiStokGain,
                'penyusutan' => $bebanPenyusutan,
            ],
            'labaBersihSebelumPajak' => $labaBersihSebelumPajak,
            'bebanPajak' => $bebanPajak,
            'labaBersih' => $labaBersihSetelahPajak,
            'profitSharing' => $profitSharing,
        ];
    }

    public function incomeStatement(Request $request)
    {
        return Inertia::render('Reports/IncomeStatement', $this->getIncomeStatementData($request));
    }

    public function incomeStatementPdf(Request $request)
    {
        $data = $this->getIncomeStatementData($request);
        $pdf = Pdf::loadView('pdf.income-statement', $data);

        return $pdf->download('Laporan_Laba_Rugi_'.$data['startDate'].'_to_'.$data['endDate'].'.pdf');
    }

    private function getBalanceSheetData(Request $request)
    {
        $bounds = [];
        foreach ([
            Kas::selectRaw('MAX(COALESCE(tanggal, DATE(created_at))) as mx')->first(),
            Penjualan::selectRaw('MAX(DATE(created_at)) as mx')->first(),
            PengeluaranOperasional::selectRaw('MAX(tanggal) as mx')->first(),
        ] as $row) {
            if ($row && $row->mx) {
                $bounds[] = $row->mx;
            }
        }
        $defaultDate = ! empty($bounds) ? max($bounds) : Carbon::now()->toDateString();

        $date = $request->input('date', $defaultDate);

        // 1. ASET (HARTA)
        // a. Aset Lancar
        $kas = (float) ($this->applyKasOnOrBefore(Kas::where('masuk', '>', 0), $date)->sum('masuk')
            - $this->applyKasOnOrBefore(Kas::where('keluar', '>', 0), $date)->sum('keluar'));

        $piutang = 0.0;

        $persediaanBahan = (float) BahanBaku::sum(DB::raw('stok * harga_satuan'));
        $persediaanProduk = (float) Produk::sum(DB::raw('stok * hpp'));

        $totalAsetLancar = $kas + $persediaanBahan + $persediaanProduk;

        // b. Aset Tetap
        $peralatanAwal = (float) Peralatan::where('tgl_beli', '<=', $date)->sum('harga_perolehan');
        $akumulasiPenyusutan = $this->getAkumulasiPenyusutan($date);
        $peralatan = $peralatanAwal - $akumulasiPenyusutan;

        $totalAset = $totalAsetLancar + $peralatan;

        // 2. KEWAJIBAN (HUTANG)
        $hutangDagang = 0.0;
        $hutangPajak = 0.0;
        $hutang = 0.0;

        // 3. EKUITAS (MODAL)
        $modalKas = (float) Modal::where(DB::raw('DATE(created_at)'), '<=', $date)->sum('nominal');
        // Asumsi: Karena Peralatan tidak memotong Kas/Hutang di sistem, maka Peralatan diakui sebagai Modal Bawaan Fisik (Nilai Awal).
        $modal = $modalKas + $peralatanAwal;

        // Laba Ditahan (Kumulatif Laba Bersih sejak awal s.d $date)
        $pendapatanKumulatif = Penjualan::where(DB::raw('DATE(created_at)'), '<=', $date)->sum('total');
        $hppKumulatif = DB::table('detail_penjualans')
            ->join('penjualans', 'detail_penjualans.penjualan_id', '=', 'penjualans.id')
            ->join('produks', 'detail_penjualans.produk_id', '=', 'produks.id')
            ->where(DB::raw('DATE(penjualans.created_at)'), '<=', $date)
            ->sum(DB::raw('detail_penjualans.qty * produks.hpp'));

        $operasionalKasKumulatif = PengeluaranOperasional::where('tanggal', '<=', $date)->sum('nominal');

        $koreksiStokLossKumulatif = (float) DB::table('koreksi_stoks')
            ->join('produks', 'koreksi_stoks.produk_id', '=', 'produks.id')
            ->where('koreksi_stoks.jenis_koreksi', 'keluar')
            ->where(DB::raw('DATE(koreksi_stoks.created_at)'), '<=', $date)
            ->sum(DB::raw('koreksi_stoks.qty * produks.hpp'));

        $koreksiStokGainKumulatif = (float) DB::table('koreksi_stoks')
            ->join('produks', 'koreksi_stoks.produk_id', '=', 'produks.id')
            ->where('koreksi_stoks.jenis_koreksi', 'masuk')
            ->where(DB::raw('DATE(koreksi_stoks.created_at)'), '<=', $date)
            ->sum(DB::raw('koreksi_stoks.qty * produks.hpp'));

        $operasionalKumulatif = $operasionalKasKumulatif + $koreksiStokLossKumulatif - $koreksiStokGainKumulatif + $akumulasiPenyusutan;

        $labaDitahan = (float) ($pendapatanKumulatif - $hppKumulatif - $operasionalKumulatif);

        $totalEkuitas = $modal + $labaDitahan;
        $totalKewajibanDanEkuitas = $hutang + $totalEkuitas;

        return [
            'date' => $date,
            'assets' => [
                'kas' => $kas,
                'piutang' => $piutang,
                'persediaanBahan' => $persediaanBahan,
                'persediaanProduk' => $persediaanProduk,
                'totalAsetLancar' => $totalAsetLancar,
                'peralatan' => $peralatan,
                'totalAset' => $totalAset,
            ],
            'liabilities' => [
                'hutang' => $hutangDagang,
                'hutangPajak' => $hutangPajak,
                'totalHutang' => $hutang,
            ],
            'equity' => [
                'modal' => $modal,
                'labaDitahan' => $labaDitahan,
                'totalEkuitas' => $totalEkuitas,
            ],
            'totalKewajibanDanEkuitas' => $totalKewajibanDanEkuitas,
            'isBalanced' => abs($totalAset - $totalKewajibanDanEkuitas) < 0.01,
        ];
    }

    public function balanceSheet(Request $request)
    {
        return Inertia::render('Reports/BalanceSheet', $this->getBalanceSheetData($request));
    }

    public function balanceSheetPdf(Request $request)
    {
        $data = $this->getBalanceSheetData($request);
        $pdf = Pdf::loadView('pdf.balance-sheet', $data);

        return $pdf->download('Laporan_Posisi_Keuangan_'.$data['date'].'.pdf');
    }
}
