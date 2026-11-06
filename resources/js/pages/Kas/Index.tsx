import { Head, usePage } from '@inertiajs/react';
import { BatchFilter, type BatchOption } from '@/components/batch-filter';
import { index } from '@/actions/App/Http/Controllers/KasController';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { KasType } from './column';
import { columns } from './column';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowUpCircle, ArrowDownCircle, Landmark, X } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { CreateAdjustment } from './CreateAdjustment';

interface Metrics {
    totalMasuk: number;
    totalKeluar: number;
    saldoSaatIni: number;
}

export default function KasIndex({ transactions, metrics, batches = [], filters }: { transactions: KasType[], metrics: Metrics, batches?: BatchOption[], filters?: { pre_order_id?: string | number | null } }) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Local filters state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sumber, setSumber] = useState('all');

    // Filter transactions
    const filteredTransactions = transactions.filter(t => {
        if (startDate && t.tanggal && t.tanggal < startDate) return false;
        if (endDate && t.tanggal && t.tanggal > endDate) return false;
        if (sumber !== 'all' && t.sumber !== sumber) return false;
        return true;
    });

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSumber('all');
    };

    return (
        <>
            <Head title="Buku Kas Umum" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-2xl p-3 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Buku Kas Umum</h1>
                        <p className="text-xs text-muted-foreground">Arus lalu lintas uang tunai dan rekening Gabin</p>
                    </div>
                    <div className="w-full sm:w-auto">
                        <CreateAdjustment />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 mb-1">
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Total Masuk</CardTitle>
                            <ArrowUpCircle className="h-4 w-4 text-green-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold text-green-600 dark:text-green-400 truncate">
                                {formatRupiah(metrics.totalMasuk)}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Inflow kas</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Total Keluar</CardTitle>
                            <ArrowDownCircle className="h-4 w-4 text-red-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold text-red-600 dark:text-red-400 truncate">
                                {formatRupiah(metrics.totalKeluar)}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Outflow kas</p>
                        </CardContent>
                    </Card>
                    <Card className="col-span-2 md:col-span-1 rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Saldo Kas Dompet</CardTitle>
                            <Landmark className="h-4 w-4 text-blue-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className={`text-xl sm:text-2xl font-extrabold truncate ${metrics.saldoSaatIni >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600'}`}>
                                {formatRupiah(metrics.saldoSaatIni)}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Uang riil sekarang</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-muted/30 p-3 sm:p-4 rounded-2xl border">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 w-full">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-muted-foreground">Batch Pre-Order</label>
                            <BatchFilter
                                batches={batches}
                                value={filters?.pre_order_id}
                                url={index().url}
                                className="h-9 w-full rounded-xl bg-card text-xs"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-muted-foreground">Dari Tanggal</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-card h-9 rounded-xl text-xs"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-muted-foreground">Sampai Tanggal</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-card h-9 rounded-xl text-xs"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-muted-foreground">Sumber Aliran Kas</label>
                            <Select value={sumber} onValueChange={setSumber}>
                                <SelectTrigger className="w-full bg-card h-9 rounded-xl text-xs">
                                    <SelectValue placeholder="Semua Sumber" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Sumber</SelectItem>
                                    <SelectItem value="modal">Setoran Modal</SelectItem>
                                    <SelectItem value="operasional">Biaya Operasional</SelectItem>
                                    <SelectItem value="pembelian">Pembelian</SelectItem>
                                    <SelectItem value="penjualan">Penjualan</SelectItem>
                                    <SelectItem value="hutang">Hutang Usaha</SelectItem>
                                    <SelectItem value="piutang">Piutang Usaha</SelectItem>
                                    <SelectItem value="peralatan">Peralatan</SelectItem>
                                    <SelectItem value="lainnya">Penyesuaian Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    {(startDate || endDate || sumber !== 'all') && (
                        <Button variant="outline" size="sm" onClick={resetFilters} className="shrink-0 h-9 rounded-xl text-xs flex items-center justify-center gap-1" title="Hapus Filter">
                            <X className="h-3.5 w-3.5" /> Reset Filter
                        </Button>
                    )}
                </div>

                <DataTable columns={columns} data={filteredTransactions} searchKey="keterangan" />
            </div>
        </>
    );
}
