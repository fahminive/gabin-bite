import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BatchFilter, type BatchOption } from '@/components/batch-filter';
import { formatRupiah } from '@/lib/utils';
import { Calendar, Printer, Scale, ShieldAlert, CheckCircle } from 'lucide-react';
import * as reports from '@/actions/App/Http/Controllers/LaporanController';

interface Props {
    date: string;
    preOrderId?: string | number | null;
    batches?: BatchOption[];
    assets: {
        kas: number;
        piutang: number;
        persediaanBahan: number;
        persediaanProduk: number;
        totalAsetLancar: number;
        totalAset: number;
    };
    liabilities: {
        hutang: number;
        hutangPajak: number;
        totalHutang: number;
    };
    equity: {
        modal: number;
        labaDitahan: number;
        totalEkuitas: number;
    };
    totalKewajibanDanEkuitas: number;
    isBalanced: boolean;
}

export default function BalanceSheet({
    date,
    preOrderId,
    batches = [],
    assets,
    liabilities,
    equity,
    totalKewajibanDanEkuitas,
    isBalanced,
}: Props) {
    const [filterDate, setFilterDate] = useState(date);

    const batchQuery = preOrderId ? { pre_order_id: preOrderId } : {};

    function handleFilter() {
        router.visit(reports.balanceSheet().url, {
            data: {
                date: filterDate,
                ...batchQuery,
            },
            preserveState: true,
        });
    }

    function handlePrint() {
        window.open(reports.balanceSheetPdf({ query: { date: filterDate, ...batchQuery } }).url, '_blank');
    }

    return (
        <>
            <Head title="Neraca Keuangan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 print:p-0">
                {/* Header Section */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Neraca (Posisi Keuangan)</h1>
                        <p className="text-sm text-muted-foreground">
                            Ringkasan saldo aset, kewajiban, dan ekuitas perusahaan
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg border bg-card p-2 shadow-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="h-8 w-36 border-0 p-0 focus-visible:ring-0"
                            />
                        </div>
                        <BatchFilter
                            batches={batches}
                            value={preOrderId}
                            url={reports.balanceSheet().url}
                            extraQuery={{ date: filterDate }}
                        />
                        <Button onClick={handleFilter}>Terapkan</Button>
                        <Button variant="outline" size="icon" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Print Title */}
                <div className="hidden print:block text-center mb-6">
                    <h1 className="text-2xl font-bold">GABINBITE.PWT - LAPORAN NERACA KEUANGAN</h1>
                    <p className="text-sm text-muted-foreground">
                        Per Tanggal: {date}
                    </p>
                    <hr className="mt-4 border-t-2" />
                </div>

                {/* Balance Notification Banner */}
                <div className="print:hidden">
                    {isBalanced ? (
                        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-400">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-sm">Neraca Seimbang (Balanced)</h3>
                                <p className="text-xs opacity-90">Total Aset cocok dengan total Kewajiban & Ekuitas.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-sm">Neraca Tidak Seimbang (Unbalanced)</h3>
                                <p className="text-xs opacity-90">Terdapat selisih sebesar {formatRupiah(Math.abs(assets.totalAset - totalKewajibanDanEkuitas))}. Periksa kembali input jurnal keuangan.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Structured Balance Sheet */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto w-full">
                    
                    {/* AKTIVA / ASET */}
                    <Card className="shadow-md overflow-hidden h-full flex flex-col p-0 gap-0">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Scale className="h-4 w-4 text-primary" />
                                Aset (Aktiva)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 px-6 pb-6 flex-1 flex flex-col justify-between">
                            <div className="space-y-6">
                                {/* ASET LANCAR */}
                                <div className="space-y-2">
                                    <h4 className="font-bold text-xs text-muted-foreground tracking-wider uppercase">Aset Lancar</h4>
                                    <div className="flex justify-between items-center text-sm border-b py-2 pl-4">
                                        <span>Kas & Bank</span>
                                        <span className="font-semibold">{formatRupiah(assets.kas)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b py-2 pl-4">
                                        <span>Piutang Dagang / Usaha</span>
                                        <span className="font-semibold">{formatRupiah(assets.piutang)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b py-2 pl-4">
                                        <span>Persediaan Bahan Baku</span>
                                        <span className="font-semibold">{formatRupiah(assets.persediaanBahan)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b py-2 pl-4">
                                        <span>Persediaan Produk Jadi</span>
                                        <span className="font-semibold">{formatRupiah(assets.persediaanProduk)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold bg-muted/30 p-2 rounded">
                                        <span>Total Aset Lancar</span>
                                        <span>{formatRupiah(assets.totalAsetLancar)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* TOTAL AKTIVA */}
                            <div className="flex justify-between items-center p-4 bg-primary/10 dark:bg-primary/20 border border-primary/30 text-primary font-extrabold rounded-lg text-lg shadow-sm mt-6">
                                <span>TOTAL ASET (AKTIVA)</span>
                                <span>{formatRupiah(assets.totalAset)}</span>
                            </div>

                        </CardContent>
                    </Card>

                    {/* KEWAJIBAN & EKUITAS */}
                    <Card className="shadow-md overflow-hidden h-full flex flex-col p-0 gap-0">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Scale className="h-4 w-4 text-primary" />
                                Kewajiban & Ekuitas (Pasiva)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 px-6 pb-6 flex-1 flex flex-col justify-between">
                            <div className="space-y-6">
                                {/* KEWAJIBAN */}
                                <div className="space-y-2">
                                    <h4 className="font-bold text-xs text-muted-foreground tracking-wider uppercase">Kewajiban / Liabilitas</h4>
                                    <div className="flex justify-between items-center text-sm border-b py-2 pl-4">
                                        <span>Kewajiban / Hutang Operasional</span>
                                        <span className="font-semibold">{formatRupiah(liabilities.hutang)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold bg-muted/30 p-2 rounded">
                                        <span>Total Kewajiban</span>
                                        <span>{formatRupiah(liabilities.totalHutang)}</span>
                                    </div>
                                </div>

                                {/* EKUITAS */}
                                <div className="space-y-2">
                                    <h4 className="font-bold text-xs text-muted-foreground tracking-wider uppercase">Ekuitas (Modal)</h4>
                                    <div className="flex justify-between items-center text-sm border-b py-2 pl-4">
                                        <span>Modal Disetor (Owner)</span>
                                        <span className="font-semibold">{formatRupiah(equity.modal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b py-2 pl-4">
                                        <span>Laba Ditahan / Berjalan</span>
                                        <span className="font-semibold">{formatRupiah(equity.labaDitahan)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold bg-muted/30 p-2 rounded">
                                        <span>Total Ekuitas</span>
                                        <span>{formatRupiah(equity.totalEkuitas)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* TOTAL PASIVA */}
                            <div className="flex justify-between items-center p-4 bg-primary/10 dark:bg-primary/20 border border-primary/30 text-primary font-extrabold rounded-lg text-lg shadow-sm mt-6">
                                <span>TOTAL PASIVA</span>
                                <span>{formatRupiah(totalKewajibanDanEkuitas)}</span>
                            </div>

                        </CardContent>
                    </Card>

                </div>
            </div>
        </>
    );
}

BalanceSheet.layout = {
    breadcrumbs: [
        { title: 'Laporan Keuangan', href: '#' },
        { title: 'Posisi Keuangan', href: reports.balanceSheet() },
    ],
};
