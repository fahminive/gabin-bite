import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { Produksi } from './column';
import { columns } from './column';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, CookingPot, Layers, ClipboardList } from 'lucide-react';
import { create } from '@/actions/App/Http/Controllers/ProduksiController';

interface Metrics {
    totalHasilBulanIni: number;
    totalTransaksiBulanIni: number;
}

export default function ProductionIndex({ productions, metrics }: { productions: Produksi[], metrics: Metrics }) {
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
            <Head title="Riwayat Produksi" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-2xl p-3 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Produksi & Manufaktur</h1>
                        <p className="text-xs text-muted-foreground">Konversi bahan baku menjadi gabin es krim siap saji</p>
                    </div>
                    <Link href={create().url} className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto rounded-xl h-9 text-xs sm:text-sm">
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Mulai Produksi
                        </Button>
                    </Link>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-1">
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Hasil Produksi</CardTitle>
                            <CookingPot className="h-4 w-4 text-blue-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 truncate">
                                {metrics.totalHasilBulanIni} Pcs
                            </div>
                            <p className="text-[10px] text-muted-foreground">Bulan ini</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Batch Produksi</CardTitle>
                            <ClipboardList className="h-4 w-4 text-emerald-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
                                {metrics.totalTransaksiBulanIni} Batch
                            </div>
                            <p className="text-[10px] text-muted-foreground">Bulan ini</p>
                        </CardContent>
                    </Card>
                </div>

                <DataTable columns={columns} data={productions} searchKey="keterangan" />
            </div>
        </>
    );
}
