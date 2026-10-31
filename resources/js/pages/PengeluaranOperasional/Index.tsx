import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { ExpenseType } from './column';
import { columns } from './column';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Flame, TrendingDown, ArrowDownUp } from 'lucide-react';
import { create } from '@/actions/App/Http/Controllers/PengeluaranOperasionalController';
import { formatRupiah } from '@/lib/utils';

interface Metrics {
    totalBulanIni: number;
    pengeluaranTerbesar: {
        kategori: string;
        nominal: number;
    };
    jumlahTransaksi: number;
}

export default function ExpenseIndex({ expenses, metrics }: { expenses: ExpenseType[], metrics: Metrics }) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <>
            <Head title="Biaya Operasional" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between gap-4 mb-2">
                    <h1 className="text-xl font-bold">Biaya Operasional</h1>
                    <Link href={create().url}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Catat Biaya
                        </Button>
                    </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pengeluaran Bulan Ini</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {formatRupiah(metrics.totalBulanIni)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pengeluaran Terbesar</CardTitle>
                            <Flame className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-orange-600 dark:text-orange-400 truncate">
                                {metrics.pengeluaranTerbesar.kategori !== '-' 
                                    ? `${metrics.pengeluaranTerbesar.kategori} (${formatRupiah(metrics.pengeluaranTerbesar.nominal)})` 
                                    : '-'}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Jumlah Transaksi Biaya</CardTitle>
                            <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {metrics.jumlahTransaksi} Transaksi
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DataTable columns={columns} data={expenses} searchKey="keterangan" />
            </div>
        </>
    );
}
