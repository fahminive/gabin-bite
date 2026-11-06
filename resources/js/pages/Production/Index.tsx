import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { Produksi } from './column';
import { columns } from './column';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, CookingPot, Layers, ClipboardList, ChefHat } from 'lucide-react';
import { create, index } from '@/actions/App/Http/Controllers/ProduksiController';

interface Metrics {
    totalHasilBulanIni: number;
    totalTransaksiBulanIni: number;
}

interface BatchOption {
    id: number;
    kode: string;
    keterangan: string;
    status: string;
}

interface ProductionNeed {
    produk_id: number;
    produk_kode: string | null;
    nama_produk: string;
    satuan: string | null;
    total_pcs: number;
    jumlah_pesanan: number;
}

interface Props {
    productions: Produksi[];
    metrics: Metrics;
    productionNeeds: ProductionNeed[];
    batches: BatchOption[];
    selectedBatchId: number | null;
}

export default function ProductionIndex({ productions, metrics, productionNeeds, batches, selectedBatchId }: Props) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const selectedBatch = batches.find(b => b.id === selectedBatchId);

    function switchBatch(batchId: string) {
        router.get(index().url, batchId ? { pre_order_id: batchId } : {}, { preserveScroll: true });
    }

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

                {/* Kartu kebutuhan produksi per batch pre-order */}
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                    <CardHeader className="pb-2 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <ChefHat className="h-4 w-4 text-primary" />
                                Kebutuhan Produksi
                                {selectedBatch && (
                                    <Badge variant="outline" className="text-[10px]">
                                        {selectedBatch.kode} — {selectedBatch.keterangan}
                                    </Badge>
                                )}
                            </CardTitle>
                            <Select
                                value={selectedBatchId ? String(selectedBatchId) : 'none'}
                                onValueChange={switchBatch}
                            >
                                <SelectTrigger className="w-full sm:w-64 h-8 text-xs">
                                    <SelectValue placeholder="Pilih batch" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Semua batch</SelectItem>
                                    {batches.map(b => (
                                        <SelectItem key={b.id} value={String(b.id)}>
                                            {b.kode} — {b.keterangan} ({b.status})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {productionNeeds.length === 0 ? (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <CookingPot className="h-4 w-4 text-emerald-500" />
                                {selectedBatchId
                                    ? 'Tidak ada pesanan yang harus dibuat di batch ini (semua sudah diserahan).'
                                    : 'Pilih batch pre-order untuk melihat kebutuhan produksi.'}
                            </p>
                        ) : (
                            <div className="flex flex-col divide-y">
                                {productionNeeds.map((need) => (
                                    <div key={need.produk_id} className="flex items-center justify-between gap-2 py-2 text-sm">
                                        <span className="font-medium truncate">
                                            {need.nama_produk}
                                            {need.produk_kode && (
                                                <span className="ml-1.5 text-xs text-muted-foreground">{need.produk_kode}</span>
                                            )}
                                        </span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {need.jumlah_pesanan} pesanan
                                        </span>
                                        <Badge variant="secondary" className="shrink-0 text-xs font-bold">
                                            {need.total_pcs} {need.satuan ?? 'pcs'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

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
