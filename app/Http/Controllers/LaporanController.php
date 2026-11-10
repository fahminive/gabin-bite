<?php

namespace App\Http\Controllers;

use App\Models\BahanBaku;
use App\Models\Hutang;
use App\Models\Kas;
use App\Models\Modal;
use App\Models\Mitra;
use App\Models\Penjualan;
use App\Models\PreOrder;
use App\Models\Produk;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LaporanController extends Controller
{
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

    private function preOrderId(Request $request): ?int
    {
        $id = $request->input('pre_order_id');

        return $id ? (int) $id : null;
    }

    private function batches()
    {
        return PreOrder::orderByDesc('created_at')->get(['id', 'kode', 'keterangan']);
    }

    /**
     * Map hasil agregasi baris kas (per `sumber` + `sumber_dana`) ke struktur
     * yang dipakai view: kategori baku sesuai arah arus kas, sisanya masuk
     * ke Penyesuaian Kas yang dipecah per sumber dana (uang usaha / member).
     * Total dihitung dari SEMUA baris sehingga tidak ada kas yang terlewat.
     *
     * @param  \Illuminate\Support\Collection<int, object{sumber: string|null, sumber_dana: string|null, total: string|float|int}>  $rows
     * @param  array<string, float>  $formatted  kategori baku arah ini, nilai awal 0
     * @return array{0: array<string, float>, 1: float}
     */
    private function mapKasRowsToFlow($rows, array $knownSources, array $formatted)
    {
        $total = 0.0;

        foreach ($rows as $row) {
            $val = (float) $row->total;
            $total += $val;
            $src = $row->sumber ?: 'lainnya';

            if (in_array($src, $knownSources, true)) {
                $formatted[$src] += $val;
                continue;
            }

            // Penyesuaian kas manual — dicatat per sumber dana agar perubahan
            // kas (uang usaha / uang member) tetap terlihat dan terhitung.
            $danaKey = $row->sumber_dana === 'simpanan_usaha'
                ? 'cashUsaha'
                : ($row->sumber_dana === 'pribadi' ? 'cashPribadi' : 'cashLainnya');
            $formatted[$danaKey] += $val;
        }

        return [$formatted, $total];
    }

    private function getCashFlowData(Request $request)
    {
        [$startDate, $endDate] = $this->resolveDefaultDateRange($request);
        $preOrderId = $this->preOrderId($request);

        // 1. Saldo Awal Kas
        $saldoAwal = $this->applyKasBefore(Kas::query()->forPreOrder($preOrderId)->where('masuk', '>', 0), $startDate)->sum('masuk')
            - $this->applyKasBefore(Kas::query()->forPreOrder($preOrderId)->where('keluar', '>', 0), $startDate)->sum('keluar');

        // 2. Arus Kas Masuk — dikelompokkan per `sumber` + `sumber_dana` sekaligus
        //    (1 query) supaya penyesuaian kas manual (uang usaha/member) ikut
        //    terhitung dalam total dan tampil sebagai kategori tersendiri.
        $inflowRows = $this->applyKasBetween(Kas::query()->forPreOrder($preOrderId)->where('masuk', '>', 0), $startDate, $endDate)
            ->selectRaw('sumber, sumber_dana, SUM(masuk) as total')
            ->groupBy('sumber', 'sumber_dana')
            ->get();

        // 3. Arus Kas Keluar
        $outflowRows = $this->applyKasBetween(Kas::query()->forPreOrder($preOrderId)->where('keluar', '>', 0), $startDate, $endDate)
            ->selectRaw('sumber, sumber_dana, SUM(keluar) as total')
            ->groupBy('sumber', 'sumber_dana')
            ->get();

        [$formattedInflows, $totalInflow] = $this->mapKasRowsToFlow($inflowRows, ['penjualan', 'piutang', 'modal'], ['penjualan' => 0.0, 'piutang' => 0.0, 'modal' => 0.0, 'cashUsaha' => 0.0, 'cashPribadi' => 0.0, 'cashLainnya' => 0.0]);
        [$formattedOutflows, $totalOutflow] = $this->mapKasRowsToFlow($outflowRows, ['pembelian', 'hutang'], ['pembelian' => 0.0, 'hutang' => 0.0, 'cashUsaha' => 0.0, 'cashPribadi' => 0.0, 'cashLainnya' => 0.0]);

        $saldoAkhir = $saldoAwal + $totalInflow - $totalOutflow;

        // Jembatan "Saldo Kas → Cuan" (mengapa saldo kas ≠ laba):
        //   laba kas ≈ saldo kas
        //     − setoran modal usaha   (bukan hasil usaha)
        //     − dana pribadi member   (money milik partner, bukan usaha)
        //     − uang muka belum diserahkan (kas masuk, pendapatan belum diakui)
        //     − nilai persediaan hari ini  (bahan & produk yang belum jadi omzet)
        $setoranModal = (float) ($formattedInflows['modal'] ?? 0);
        $danaPribadiNet = (float) ($formattedInflows['cashPribadi'] ?? 0)
            - (float) ($formattedOutflows['cashPribadi'] ?? 0);

        $uangMukaBelumSerahkan = (float) Penjualan::query()
            ->when($preOrderId, fn ($q) => $q->where('pre_order_id', $preOrderId))
            ->where('status_pembayaran', 'sudah_bayar')
            ->whereNull('tanggal_diberikan')
            ->where('status_penyerahan', 'belum_diberikan')
            ->sum('total');

        $persediaanBahan = (float) BahanBaku::sum(DB::raw('stok * harga_satuan'));
        $persediaanProduk = (float) Produk::sum(DB::raw('stok * hpp'));

        $cuanKas = $saldoAkhir
            - $setoranModal
            - $danaPribadiNet
            - $uangMukaBelumSerahkan
            - $persediaanBahan
            - $persediaanProduk;

        // Laba akrual (dari tab Cuan/Boncos, basis serah terima) untuk
        // pembanding langsung di tampilan.
        $labaAkrual = $this->getIncomeStatementData($request)['labaBersih'];

        return [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'preOrderId' => $preOrderId,
            'batches' => $this->batches(),
            'saldoAwal' => $saldoAwal,
            'inflows' => $formattedInflows,
            'outflows' => $formattedOutflows,
            'totalInflow' => $totalInflow,
            'totalOutflow' => $totalOutflow,
            'saldoAkhir' => $saldoAkhir,
            'bridge' => [
                'saldoAkhir' => $saldoAkhir,
                'setoranModal' => $setoranModal,
                'danaPribadiNet' => $danaPribadiNet,
                'uangMukaBelumSerahkan' => $uangMukaBelumSerahkan,
                'persediaanBahan' => $persediaanBahan,
                'persediaanProduk' => $persediaanProduk,
                'cuanKas' => $cuanKas,
                'labaAkrual' => $labaAkrual,
            ],
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

    private function deliveredCondition(string $table = 'penjualans'): array
    {
        // Pendapatan diakui saat serah terima (akrual). Pesanan yang sudah
        // dibayar tapi belum diserahkan dihitung sebagai uang muka, bukan
        // pendapatan — sehingga Cuan/Boncos tidak "khayalan" untuk batch
        // yang belum tuntas.
        return [
            "({$table}.tanggal_diberikan IS NOT NULL OR {$table}.status_penyerahan = 'sudah_diberikan')",
            [],
        ];
    }

    private function getIncomeStatementData(Request $request)
    {
        [$startDate, $endDate] = $this->resolveDefaultDateRange($request);
        $preOrderId = $this->preOrderId($request);

        // 1. Pendapatan Penjualan — hanya pesanan yang SUDAH DISERAHKAN.
        //    Uang muka yang belum diserahkan masuk "Cashing uang muka" di
        //    laporan arus kas, bukan ke sini (akrual kegiatan).
        [$deliveredWhere, $deliveredBindings] = $this->deliveredCondition('penjualans');

        $pendapatan = (float) Penjualan::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->when($preOrderId, fn ($q) => $q->where('pre_order_id', $preOrderId))
            ->whereRaw($deliveredWhere, $deliveredBindings)
            ->sum('total');

        // 2. Harga Pokok Penjualan (HPP) — ikut basis serah terima agar
        //    konsisten dengan pendapatan.
        $hpp = (float) DB::table('detail_penjualans')
            ->join('penjualans', 'detail_penjualans.penjualan_id', '=', 'penjualans.id')
            ->join('produks', 'detail_penjualans.produk_id', '=', 'produks.id')
            ->whereBetween(DB::raw('DATE(penjualans.created_at)'), [$startDate, $endDate])
            ->when($preOrderId, fn ($q) => $q->where('penjualans.pre_order_id', $preOrderId))
            ->whereRaw($deliveredWhere, $deliveredBindings)
            ->sum(DB::raw('detail_penjualans.qty * produks.hpp'));

        // Uang muka: sudah dibayar (kas sudah masuk) tapi belum diserahkan —
        // bukan pendapatan, hanya lompatan waktu kas vs laba.
        $uangMukaBelumSerah = (float) Penjualan::whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->when($preOrderId, fn ($q) => $q->where('pre_order_id', $preOrderId))
            ->where('status_pembayaran', 'sudah_bayar')
            ->whereNull('tanggal_diberikan')
            ->where('status_penyerahan', 'belum_diberikan')
            ->sum('total');

        // 3. Laba Kotor
        $labaKotor = $pendapatan - $hpp;

        // 4. Beban Operasional: hanya rugi/laba dari koreksi stok
        //    (fitur biaya operasional & penyusutan peralatan sudah dihapus).
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

        $operasional = $koreksiStokLoss - $koreksiStokGain;

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
            'preOrderId' => $preOrderId,
            'batches' => $this->batches(),
            'pendapatan' => $pendapatan,
            'hpp' => $hpp,
            'labaKotor' => $labaKotor,
            'operasional' => $operasional,
            'operasionalDetail' => [
                'koreksiStokLoss' => $koreksiStokLoss,
                'koreksiStokGain' => $koreksiStokGain,
            ],
            'labaBersihSebelumPajak' => $labaBersihSebelumPajak,
            'bebanPajak' => $bebanPajak,
            'labaBersih' => $labaBersihSetelahPajak,
            'uangMukaBelumSerah' => $uangMukaBelumSerah,
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
        ] as $row) {
            if ($row && $row->mx) {
                $bounds[] = $row->mx;
            }
        }
        $defaultDate = ! empty($bounds) ? max($bounds) : Carbon::now()->toDateString();

        $date = $request->input('date', $defaultDate);
        $preOrderId = $this->preOrderId($request);

        // 1. ASET (HARTA)
        // a. Aset Lancar
        $kas = (float) ($this->applyKasOnOrBefore(Kas::query()->forPreOrder($preOrderId)->where('masuk', '>', 0), $date)->sum('masuk')
            - $this->applyKasOnOrBefore(Kas::query()->forPreOrder($preOrderId)->where('keluar', '>', 0), $date)->sum('keluar'));

        $piutang = 0.0;

        $persediaanBahan = (float) BahanBaku::sum(DB::raw('stok * harga_satuan'));
        $persediaanProduk = (float) Produk::sum(DB::raw('stok * hpp'));

        $totalAsetLancar = $kas + $persediaanBahan + $persediaanProduk;

        // Fitur aset tetap (peralatan) sudah dihapus.
        $totalAset = $totalAsetLancar;

        // 2. KEWAJIBAN (HUTANG)
        $hutangDagang = 0.0;
        $hutangPajak = 0.0;
        $hutang = 0.0;

        // 3. EKUITAS (MODAL)
        $modal = (float) Modal::where(DB::raw('DATE(created_at)'), '<=', $date)->sum('nominal');

        // Laba Ditahan (Kumulatif Laba Bersih sejak awal s.d $date)
        [$deliveredWhere, $deliveredBindings] = $this->deliveredCondition('penjualans');

        $pendapatanKumulatif = Penjualan::where(DB::raw('DATE(created_at)'), '<=', $date)
            ->when($preOrderId, fn ($q) => $q->where('pre_order_id', $preOrderId))
            ->whereRaw($deliveredWhere, $deliveredBindings)
            ->sum('total');
        $hppKumulatif = DB::table('detail_penjualans')
            ->join('penjualans', 'detail_penjualans.penjualan_id', '=', 'penjualans.id')
            ->join('produks', 'detail_penjualans.produk_id', '=', 'produks.id')
            ->where(DB::raw('DATE(penjualans.created_at)'), '<=', $date)
            ->when($preOrderId, fn ($q) => $q->where('penjualans.pre_order_id', $preOrderId))
            ->whereRaw($deliveredWhere, $deliveredBindings)
            ->sum(DB::raw('detail_penjualans.qty * produks.hpp'));

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

        $operasionalKumulatif = $koreksiStokLossKumulatif - $koreksiStokGainKumulatif;

        $labaDitahan = (float) ($pendapatanKumulatif - $hppKumulatif - $operasionalKumulatif);

        $totalEkuitas = $modal + $labaDitahan;
        $totalKewajibanDanEkuitas = $hutang + $totalEkuitas;

        return [
            'date' => $date,
            'preOrderId' => $preOrderId,
            'batches' => $this->batches(),
            'assets' => [
                'kas' => $kas,
                'piutang' => $piutang,
                'persediaanBahan' => $persediaanBahan,
                'persediaanProduk' => $persediaanProduk,
                'totalAsetLancar' => $totalAsetLancar,
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
