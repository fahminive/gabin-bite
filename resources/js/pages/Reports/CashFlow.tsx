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
import { formatRupiah } from '@/lib/utils';
import { ArrowDownUp, Calendar, TrendingDown, TrendingUp, Wallet, Printer } from 'lucide-react';
import * as reports from '@/actions/App/Http/Controllers/LaporanController';

interface Props {
    startDate: string;
    endDate: string;
    saldoAwal: number;
    inflows: {
        penjualan: number;
        piutang: number;
        modal: number;
        lainnya: number;
    };
    outflows: {
        pembelian: number;
        hutang: number;
        operasional: number;
        peralatan: number;
        lainnya: number;
    };
    totalInflow: number;
    totalOutflow: number;
    saldoAkhir: number;
}

export default function CashFlow({
    startDate,
    endDate,
    saldoAwal,
    inflows,
    outflows,
    totalInflow,
    totalOutflow,
    saldoAkhir,
}: Props) {
    const [filterStart, setFilterStart] = useState(startDate);
    const [filterEnd, setFilterEnd] = useState(endDate);

    function handleFilter() {
        router.visit(reports.cashFlow().url, {
            data: {
                start_date: filterStart,
                end_date: filterEnd,
            },
            preserveState: true,
        });
    }

    function handlePrint() {
        window.open(reports.cashFlowPdf({ query: { start_date: filterStart, end_date: filterEnd } }).url, '_blank');
    }

    return (
        <>
            <Head title="Laporan Arus Kas" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">
                {/* Header Section */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Laporan Arus Kas</h1>
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
                            <span className="text-muted-foreground text-sm">s/d</span>
                            <Input
                                type="date"
                                value={filterEnd}
                                onChange={(e) => setFilterEnd(e.target.value)}
                                className="h-8 w-36 border-0 p-0 focus-visible:ring-0"
                            />
                        </div>
                        <Button onClick={handleFilter}>Terapkan</Button>
                        <Button variant="outline" size="icon" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Print Title */}
                <div className="hidden print:block text-center mb-6">
                    <h1 className="text-2xl font-bold">GABINBITE.PWT — LAPORAN ARUS KAS</h1>
                    <p className="text-sm text-muted-foreground">
                        Periode: {startDate} s/d {endDate}
                    </p>
                    <hr className="mt-4 border-t-2" />
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Awal</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatRupiah(saldoAwal)}</div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">Total Kas Masuk</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-green-600">{formatRupiah(totalInflow)}</div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-destructive">Total Kas Keluar</CardTitle>
                            <TrendingDown className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-destructive">{formatRupiah(totalOutflow)}</div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden shadow-sm bg-primary/5 dark:bg-primary/10 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-primary">Saldo Akhir Kas</CardTitle>
                            <ArrowDownUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-primary">{formatRupiah(saldoAkhir)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Table */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                    {/* Inflow Details */}
                    <Card className="shadow-sm overflow-hidden h-full flex flex-col p-0 gap-0">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                Rincian Arus Kas Masuk (Inflow)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col justify-between">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sumber Penerimaan</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Penjualan Produk Tunai</TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">{formatRupiah(inflows.penjualan)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Penerimaan Cicilan Piutang</TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">{formatRupiah(inflows.piutang)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Setoran Modal Owner</TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">{formatRupiah(inflows.modal)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Lainnya / Penyesuaian Manual</TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">{formatRupiah(inflows.lainnya)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                            <div className="border-t bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 px-6 py-4 font-bold flex justify-between items-center text-sm">
                                <span>Total Kas Masuk</span>
                                <span className="text-emerald-700 dark:text-emerald-400 text-base">{formatRupiah(totalInflow)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Outflow Details */}
                    <Card className="shadow-sm overflow-hidden h-full flex flex-col p-0 gap-0">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-destructive" />
                                Rincian Arus Kas Keluar (Outflow)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col justify-between">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tujuan Pengeluaran</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Pembelian Bahan Baku Tunai</TableCell>
                                        <TableCell className="text-right text-destructive font-medium">{formatRupiah(outflows.pembelian)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Pembayaran Cicilan Hutang</TableCell>
                                        <TableCell className="text-right text-destructive font-medium">{formatRupiah(outflows.hutang)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Biaya Operasional Rutin</TableCell>
                                        <TableCell className="text-right text-destructive font-medium">{formatRupiah(outflows.operasional)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Pembelian Aset Tetap (Peralatan)</TableCell>
                                        <TableCell className="text-right text-destructive font-medium">{formatRupiah(outflows.peralatan)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Lainnya / Penyesuaian Manual</TableCell>
                                        <TableCell className="text-right text-destructive font-medium">{formatRupiah(outflows.lainnya)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                            <div className="border-t bg-destructive/10 dark:bg-destructive/20 border-destructive/30 px-6 py-4 font-bold flex justify-between items-center text-sm">
                                <span>Total Kas Keluar</span>
                                <span className="text-destructive dark:text-red-400 text-base">{formatRupiah(totalOutflow)}</span>
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
