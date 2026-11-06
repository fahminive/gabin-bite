import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { BatchFilter, type BatchOption } from '@/components/batch-filter';
import { formatRupiah } from '@/lib/utils';
import {
    ArrowDownUp,
    Calendar,
    TrendingDown,
    TrendingUp,
    Wallet,
    Printer,
} from 'lucide-react';
import * as reports from '@/actions/App/Http/Controllers/LaporanController';

interface Props {
    startDate: string;
    endDate: string;
    preOrderId?: string | number | null;
    batches?: BatchOption[];
    saldoAwal: number;
    inflows: {
        penjualan: number;
        piutang: number;
        modal: number;
        cashUsaha: number;
        cashPribadi: number;
        cashLainnya: number;
    };
    outflows: {
        pembelian: number;
        hutang: number;
        operasional: number;
        peralatan: number;
        cashUsaha: number;
        cashPribadi: number;
        cashLainnya: number;
    };
    totalInflow: number;
    totalOutflow: number;
    saldoAkhir: number;
}

export default function CashFlow({
    startDate,
    endDate,
    preOrderId,
    batches = [],
    saldoAwal,
    inflows,
    outflows,
    totalInflow,
    totalOutflow,
    saldoAkhir,
}: Props) {
    const [filterStart, setFilterStart] = useState(startDate);
    const [filterEnd, setFilterEnd] = useState(endDate);

    const batchQuery = preOrderId ? { pre_order_id: preOrderId } : {};

    function handleFilter() {
        router.visit(reports.cashFlow().url, {
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
            reports.cashFlowPdf({
                query: {
                    start_date: filterStart,
                    end_date: filterEnd,
                    ...batchQuery,
                },
            }).url,
            '_blank',
        );
    }

    return (
        <>
            <Head title="Laporan Arus Kas" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">
                {/* Header Section */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Laporan Arus Kas
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Ringkasan perputaran uang kas masuk dan keluar
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg border bg-card p-2 shadow-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Input
                                type="date"
                                value={filterStart}
                                onChange={(e) => setFilterStart(e.target.value)}
                                className="h-8 w-36 border-0 p-0 focus-visible:ring-0"
                            />
                            <span className="text-sm text-muted-foreground">
                                s/d
                            </span>
                            <Input
                                type="date"
                                value={filterEnd}
                                onChange={(e) => setFilterEnd(e.target.value)}
                                className="h-8 w-36 border-0 p-0 focus-visible:ring-0"
                            />
                        </div>
                        <BatchFilter
                            batches={batches}
                            value={preOrderId}
                            url={reports.cashFlow().url}
                            extraQuery={{
                                start_date: filterStart,
                                end_date: filterEnd,
                            }}
                        />
                        <Button onClick={handleFilter}>Terapkan</Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrint}
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Print Title */}
                <div className="mb-6 hidden text-center print:block">
                    <h1 className="text-2xl font-bold">
                        GABINBITE.PWT — LAPORAN ARUS KAS
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Periode: {startDate} s/d {endDate}
                    </p>
                    <hr className="mt-4 border-t-2" />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Saldo Awal
                            </CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">
                                {formatRupiah(saldoAwal)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">
                                Total Kas Masuk
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-green-600">
                                {formatRupiah(totalInflow)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-destructive">
                                Total Kas Keluar
                            </CardTitle>
                            <TrendingDown className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-destructive">
                                {formatRupiah(totalOutflow)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-primary/20 bg-primary/5 shadow-sm dark:bg-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-primary">
                                Saldo Akhir Kas
                            </CardTitle>
                            <ArrowDownUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-primary">
                                {formatRupiah(saldoAkhir)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Table */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Inflow Details */}
                    <Card className="flex h-full flex-col gap-0 overflow-hidden p-0 shadow-sm">
                        <CardHeader className="border-b bg-muted/40 px-6 pt-6 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                Rincian Arus Kas Masuk (Inflow)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col justify-between p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sumber Penerimaan</TableHead>
                                        <TableHead className="text-right">
                                            Jumlah
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Penjualan Produk Tunai
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            {formatRupiah(inflows.penjualan)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Penerimaan Cicilan Piutang
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            {formatRupiah(inflows.piutang)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Setoran Modal Owner
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            {formatRupiah(inflows.modal)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Penyesuaian Kas — Uang Usaha
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            {formatRupiah(inflows.cashUsaha)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Penyesuaian Kas — Uang Member
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            {formatRupiah(inflows.cashPribadi)}
                                        </TableCell>
                                    </TableRow>
                                    {inflows.cashLainnya !== 0 && (
                                        <TableRow>
                                            <TableCell className="font-medium">
                                                Penyesuaian Kas — Lainnya
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-green-600">
                                                {formatRupiah(
                                                    inflows.cashLainnya,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <div className="flex items-center justify-between border-t border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-sm font-bold dark:bg-emerald-500/20">
                                <span>Total Kas Masuk</span>
                                <span className="text-base text-emerald-700 dark:text-emerald-400">
                                    {formatRupiah(totalInflow)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Outflow Details */}
                    <Card className="flex h-full flex-col gap-0 overflow-hidden p-0 shadow-sm">
                        <CardHeader className="border-b bg-muted/40 px-6 pt-6 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <TrendingDown className="h-4 w-4 text-destructive" />
                                Rincian Arus Kas Keluar (Outflow)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col justify-between p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            Tujuan Pengeluaran
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Jumlah
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Pembelian Bahan Baku Tunai
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-destructive">
                                            {formatRupiah(outflows.pembelian)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Pembayaran Cicilan Hutang
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-destructive">
                                            {formatRupiah(outflows.hutang)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Biaya Operasional Rutin
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-destructive">
                                            {formatRupiah(outflows.operasional)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Pembelian Aset Tetap (Peralatan)
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-destructive">
                                            {formatRupiah(outflows.peralatan)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Penyesuaian Kas — Uang Usaha
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-destructive">
                                            {formatRupiah(outflows.cashUsaha)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Penyesuaian Kas — Uang Member
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-destructive">
                                            {formatRupiah(outflows.cashPribadi)}
                                        </TableCell>
                                    </TableRow>
                                    {outflows.cashLainnya !== 0 && (
                                        <TableRow>
                                            <TableCell className="font-medium">
                                                Penyesuaian Kas — Lainnya
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-destructive">
                                                {formatRupiah(
                                                    outflows.cashLainnya,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <div className="flex items-center justify-between border-t border-destructive/30 bg-destructive/10 px-6 py-4 text-sm font-bold dark:bg-destructive/20">
                                <span>Total Kas Keluar</span>
                                <span className="text-base text-destructive dark:text-red-400">
                                    {formatRupiah(totalOutflow)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

CashFlow.layout = {
    breadcrumbs: [
        { title: 'Laporan Keuangan', href: '#' },
        { title: 'Arus Kas', href: reports.cashFlow() },
    ],
};
