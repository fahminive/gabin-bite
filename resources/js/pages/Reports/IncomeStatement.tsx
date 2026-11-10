import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    Printer,
    TrendingUp,
    DollarSign,
    Activity,
    Percent,
} from 'lucide-react';
import { useState } from 'react';
import * as reports from '@/actions/App/Http/Controllers/LaporanController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BatchFilter, type BatchOption } from '@/components/batch-filter';
import { formatRupiah } from '@/lib/utils';

interface Props {
    startDate: string;
    endDate: string;
    preOrderId?: string | number | null;
    batches?: BatchOption[];
    pendapatan: number;
    hpp: number;
    labaKotor: number;
    operasional: number;
    operasionalDetail: {
        kas: number;
        koreksiStokLoss: number;
        koreksiStokGain: number;
        penyusutan: number;
    };
    labaBersihSebelumPajak: number;
    bebanPajak: number;
    labaBersih: number;
    uangMukaBelumSerah?: number;
    profitSharing: {
        id: number;
        nama: string;
        kode: string;
        share: number;
    }[];
}

export default function IncomeStatement({
    startDate,
    endDate,
    preOrderId,
    batches = [],
    pendapatan,
    hpp,
    labaKotor,
    operasional,
    operasionalDetail,
    labaBersihSebelumPajak,
    bebanPajak,
    labaBersih,
    uangMukaBelumSerah = 0,
    profitSharing,
}: Props) {
    const [filterStart, setFilterStart] = useState(startDate);
    const [filterEnd, setFilterEnd] = useState(endDate);

    const batchQuery = preOrderId ? { pre_order_id: preOrderId } : {};

    function handleFilter() {
        router.visit(reports.incomeStatement().url, {
            data: {
                start_date: filterStart,
                end_date: filterEnd,
                ...batchQuery,
            },
            preserveState: true,
        });
    }

    function handlePrint() {
        window.open(
            reports.incomeStatementPdf({
                query: { start_date: filterStart, end_date: filterEnd, ...batchQuery },
            }).url,
            '_blank',
        );
    }

    const marginKotor = pendapatan > 0 ? (labaKotor / pendapatan) * 100 : 0;
    const marginBersih = pendapatan > 0 ? (labaBersih / pendapatan) * 100 : 0;

    return (
        <>
            <Head title="Laporan Laba Rugi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">
                {/* Catatan cara baca laporan */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200 sm:text-sm print:hidden">
                    <details>
                        <summary className="cursor-pointer select-none font-semibold">
                            Cara baca laporan ini — kapan Cuan sama dengan saldo
                            kas, kapan tidak (klik untuk detail)
                        </summary>
                        <div className="mt-2 space-y-2 leading-relaxed">
                            <p>
                                Cuan/Boncos di halaman ini dihitung dengan basis{' '}
                                <strong>serah terima (akrual)</strong>: pendapatan
                                baru diakui saat barang benar-benar diserahkan ke
                                pembeli, HPP dibebankan pada saat yang sama, dan
                                diikutkan pula beban non-tunai (penyusutan
                                peralatan). Sebaliknya, <em>saldo kas</em> adalah
                                uang fisik yang benar-benar ada di dompet —
                Campuran dari setoran modal, dana pribadi partner, dan hasil
                                usaha.
                            </p>
                            <p>
                                <strong className="font-semibold">
                                    Kapan nilainya SAMA:
                                </strong>{' '}
                                bila semua penjualan dibayar tunai dan diserahkan
                                di hari yang sama, bahan yang dibeli langsung
                                diproduksi dan terjual habis dalam periode yang
                                sama, tidak ada setoran modal maupun tarikan
                                dana pribadi, dan tidak ada pembelian peralatan
                                — saat itu selisih cuan vs saldo kas mendekati{' '}
                                <span className="font-mono">0</span>.
                            </p>
                            <p className="font-semibold">Kapan sering beda dan kenapa:</p>
                            <ul className="list-disc space-y-1 pl-5">
                                <li>
                                    <strong>Uang muka belum diserahkan</strong>
                                    {uangMukaBelumSerah > 0
                                        ? ` (saat ini ${formatRupiah(uangMukaBelumSerah)})`
                                        : ''}
                                    : uang sudah masuk kas, barang belum sampai
                                    ke pembeli — kas tampak lebih besar dari
                                    cuan. Setelah semua diserahkan, selisihnya
                                    menyusul dan rapat lagi.
                                </li>
                                <li>
                                    <strong>Belanja bahan vs pemakaian bahan</strong>:
                                    kas keluar di tanggal pembelian, tapi
                                    biaya bahan baru masuk HPP ketika produk
                                    jadinya diserahkan. Bahan yang masih
                                    tersimpan di gudang tercatat sebagai
                                    persediaan, belum biaya — jadi bukan rugi.
                                </li>
                                <li>
                                    <strong>Setoran modal usaha &amp; dana pribadi
                                    member</strong>: menambah saldo kas, tapi
                                    bukan hasil penjualan, jadi hanya muncul di
                                    tab Uang Masuk-Keluar, tidak dicuan.
                                </li>
                                <li>
                                    <strong>Peralatan dibeli tunai</strong>:
                                    kas turun besar di hari pembelian, tapi
                                    cuan terbebani bertahap via penyusutan —
                                    di periode pembelian selisihnya membesar.
                                </li>
                                <li>
                                    <strong>Penyusutan &amp; koreksi stok</strong>:
                                    beban yang memperkecil cuan tanpa ada uang
                                    keluar-masuk kas.
                                </li>
                            </ul>
                            <p>
                                <strong className="font-semibold">Kesimpulan:</strong>{' '}
                                cuan mengukur{' '}
                                <em>hasil usaha yang benar-benar tuntas</em> di
                                periode ini; saldo kas hanya menunjukkan{' '}
                                <em>seberapa banyak uang yang berada di dompet
                                saat ini</em>. Selisih antara keduanya{' '}
                                <strong>bukan</strong> berarti salah satu laporan
                                keliru — komponen penyelisihnya rinci di kartu{' '}
                                <strong>
                                    <u>Jembatan: Saldo Kas → Cuan</u>
                                </strong>{' '}
                                pada tab <strong>Uang Masuk-Keluar</strong>.
                            </p>
                        </div>
                    </details>
                </div>

                {/* Header Section */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                            Laporan Laba Rugi
                        </h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                            Ringkasan profitabilitas dan kinerja usaha
                            operasional
                        </p>
                    </div>

                    <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center md:w-auto">
                        <div className="flex w-full items-center gap-2 rounded-2xl border bg-card p-2 shadow-xs sm:w-auto">
                            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="grid flex-1 grid-cols-2 gap-1.5">
                                <Input
                                    type="date"
                                    value={filterStart}
                                    onChange={(e) =>
                                        setFilterStart(e.target.value)
                                    }
                                    className="h-8 w-full border-0 p-0 text-xs focus-visible:ring-0"
                                />
                                <Input
                                    type="date"
                                    value={filterEnd}
                                    onChange={(e) =>
                                        setFilterEnd(e.target.value)
                                    }
                                    className="h-8 w-full border-0 p-0 text-xs focus-visible:ring-0"
                                />
                            </div>
                        </div>
                        <BatchFilter
                            batches={batches}
                            value={preOrderId}
                            url={reports.incomeStatement().url}
                            extraQuery={{
                                start_date: filterStart,
                                end_date: filterEnd,
                            }}
                        />
                        <div className="flex w-full items-center gap-2 sm:w-auto">
                            <Button
                                onClick={handleFilter}
                                className="h-9 flex-1 rounded-xl text-xs sm:flex-initial"
                            >
                                Terapkan
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePrint}
                                className="h-9 w-9 shrink-0 rounded-xl"
                                title="Cetak PDF"
                            >
                                <Printer className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Print Title */}
                <div className="mb-6 hidden text-center print:block">
                    <h1 className="text-2xl font-bold">
                        GABINBITE.PWT — LAPORAN LABA RUGI
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Periode: {startDate} s/d {endDate}
                    </p>
                    <hr className="mt-4 border-t-2" />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1.5 sm:p-5">
                            <CardTitle className="truncate text-xs font-extrabold text-muted-foreground sm:text-sm">
                                Pendapatan Usaha
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 shrink-0 text-green-500" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-5 sm:pt-0">
                            <div className="truncate text-sm font-extrabold text-green-600 sm:text-xl">
                                {formatRupiah(pendapatan)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1.5 sm:p-5">
                            <CardTitle className="truncate text-xs font-extrabold text-muted-foreground sm:text-sm">
                                Laba Kotor
                            </CardTitle>
                            <DollarSign className="h-4 w-4 shrink-0 text-blue-500" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-5 sm:pt-0">
                            <div className="truncate text-sm font-extrabold text-blue-600 sm:text-xl">
                                {formatRupiah(labaKotor)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1.5 sm:p-5">
                            <CardTitle className="truncate text-xs font-extrabold text-muted-foreground sm:text-sm">
                                Beban Operasional
                            </CardTitle>
                            <Activity className="h-4 w-4 shrink-0 text-destructive" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-5 sm:pt-0">
                            <div className="truncate text-sm font-extrabold text-destructive sm:text-xl">
                                {formatRupiah(operasional)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-xs dark:bg-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1.5 sm:p-5">
                            <CardTitle className="truncate text-xs font-extrabold text-primary sm:text-sm">
                                Laba Bersih
                            </CardTitle>
                            <Percent className="h-4 w-4 shrink-0 text-primary" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-5 sm:pt-0">
                            <div className="truncate text-sm font-extrabold text-primary sm:text-xl">
                                {formatRupiah(labaBersih)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Structured Income Statement */}
                <Card className="mx-auto w-full max-w-2xl gap-0 overflow-hidden p-0 shadow-md">
                    <CardHeader className="border-b bg-muted/40 px-6 pt-6 pb-4">
                        <CardTitle className="text-center text-lg font-semibold">
                            LAPORAN LABA RUGI
                        </CardTitle>
                        <p className="text-center text-xs text-muted-foreground">
                            Periode {startDate} s/d {endDate}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6 px-6 pt-6 pb-6">
                        {/* PENDAPATAN */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold tracking-wider text-muted-foreground uppercase">
                                <span>Pendapatan</span>
                            </div>
                            <div className="flex items-center justify-between border-b py-2 pl-4 text-sm">
                                <span>Pendapatan Penjualan Produk</span>
                                <span className="font-semibold">
                                    {formatRupiah(pendapatan)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded bg-muted/30 p-2 text-sm font-bold">
                                <span>Total Pendapatan</span>
                                <span>{formatRupiah(pendapatan)}</span>
                            </div>
                        </div>

                        {/* HARGA POKOK PENJUALAN */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold tracking-wider text-muted-foreground uppercase">
                                <span>Harga Pokok Penjualan (HPP)</span>
                            </div>
                            <div className="flex items-center justify-between border-b py-2 pl-4 text-sm">
                                <span>Beban HPP Produk Terjual</span>
                                <span className="font-semibold text-destructive">
                                    ({formatRupiah(hpp)})
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded bg-muted/30 p-2 text-sm font-bold">
                                <span>Total HPP</span>
                                <span>({formatRupiah(hpp)})</span>
                            </div>
                        </div>

                        {/* LABA KOTOR */}
                        <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-base font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                            <span>LABA KOTOR</span>
                            <span>{formatRupiah(labaKotor)}</span>
                        </div>

                        {/* BEBAN OPERASIONAL */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold tracking-wider text-muted-foreground uppercase">
                                <span>Beban Operasional</span>
                            </div>
                            <div className="flex items-center justify-between border-b py-2 pl-4 text-sm">
                                <span>Pengeluaran Biaya Operasional (Kas)</span>
                                <span className="font-semibold text-destructive">
                                    ({formatRupiah(operasionalDetail.kas)})
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b py-2 pl-4 text-sm">
                                <span>
                                    Kerugian Koreksi Stok (Barang Rusak/Hilang)
                                </span>
                                <span className="font-semibold text-destructive">
                                    (
                                    {formatRupiah(
                                        operasionalDetail.koreksiStokLoss,
                                    )}
                                    )
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b py-2 pl-4 text-sm">
                                <span>
                                    Keuntungan Koreksi Stok (Barang Lebih)
                                </span>
                                <span className="font-semibold text-green-600">
                                    {formatRupiah(
                                        operasionalDetail.koreksiStokGain,
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b py-2 pl-4 text-sm">
                                <span>Beban Penyusutan Peralatan</span>
                                <span className="font-semibold text-destructive">
                                    (
                                    {formatRupiah(operasionalDetail.penyusutan)}
                                    )
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded bg-muted/30 p-2 text-sm font-bold">
                                <span>Total Beban Operasional</span>
                                <span>({formatRupiah(operasional)})</span>
                            </div>
                        </div>

                        {/* LABA BERSIH */}
                        <div
                            className={`flex items-center justify-between rounded-lg border p-4 text-lg font-extrabold shadow-sm ${
                                labaBersih >= 0
                                    ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-gray-950'
                                    : 'border-destructive bg-destructive text-white'
                            }`}
                        >
                            <span>LABA BERSIH</span>
                            <span>{formatRupiah(labaBersih)}</span>
                        </div>

                        {/* ANALISIS MARGIN */}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4 text-xs text-muted-foreground">
                            <div>
                                <span className="block text-muted-foreground">
                                    Margin Laba Kotor:
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {marginKotor.toFixed(1)}%
                                </span>
                            </div>
                            <div>
                                <span className="block text-muted-foreground">
                                    Margin Laba Bersih:
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {marginBersih.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* PEMBAGIAN LABA BERSIH PER PARTNER */}
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            {profitSharing.map((p) => {
                                const isSurplus = p.share >= 0;

                                return (
                                    <Card
                                        key={p.id}
                                        className="rounded-xl border border-border/80 p-4 shadow-sm"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-xs font-medium text-muted-foreground uppercase">
                                                {p.kode}
                                            </span>
                                            <span className="text-xs font-bold text-foreground">
                                                {p.nama}
                                            </span>
                                        </div>
                                        <div className="truncate text-2xl font-extrabold">
                                            {formatRupiah(p.share)}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            Bagi hasil laba bersih (1/
                                            {profitSharing.length})
                                            {isSurplus
                                                ? ' diterima'
                                                : ' ditanggung'}
                                        </p>
                                    </Card>
                                );
                            })}
                            <Card className="rounded-xl border border-border/80 bg-muted/50 p-4 shadow-sm">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Total
                                    </span>
                                    <span className="text-xs font-bold text-foreground">
                                        Dibagi ke {profitSharing.length} partner
                                    </span>
                                </div>
                                <div className="truncate text-xl font-extrabold text-primary">
                                    {formatRupiah(labaBersih)}
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Laba bersih yang dibagikan bersama
                                </p>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

IncomeStatement.layout = {
    breadcrumbs: [
        { title: 'Laporan Keuangan', href: '#' },
        { title: 'Laba Rugi', href: reports.incomeStatement() },
    ],
};
