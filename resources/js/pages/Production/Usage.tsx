import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { CookingPot, TriangleAlert, Wheat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Batch {
    id: number;
    tanggal: string;
    qty_hasil: number;
    keterangan: string;
    produk: { nama_produk: string; satuan: string } | null;
}

interface Usage {
    bahan_id: number;
    nama_bahan: string | null;
    kode_bahan: string | null;
    satuan: string | null;
    qty_dipakai: number;
    stok_sekarang: number;
}

interface Props {
    batch: Batch;
    usage: Usage[];
}

export default function ProductionUsage({ batch, usage: usages }: Props) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <>
            <Head title={`Pemakaian Bahan - ${batch.produk?.nama_produk ?? 'Batch ' + batch.id}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-2xl p-3 sm:p-5">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
                            <CookingPot className="h-5 w-5 text-primary" />
                            {batch.produk?.nama_produk ?? 'Batch produksi'}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {batch.keterangan || 'Batch produksi'} · {batch.qty_hasil} {batch.produk?.satuan ?? ''} dihasilkan
                        </p>
                    </div>
                    <Badge variant="secondary" className="w-fit">
                        {batch.tanggal}
                    </Badge>
                </div>

                <Card className="rounded-2xl border border-border/80 shadow-xs">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                            <Wheat className="h-4 w-4 text-primary" />
                            Bahan yang Dipakai
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {usages.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Tidak ada pemakaian bahan tercatat di batch ini.</p>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
                                <div className="overflow-x-auto custom-scrollbar touch-scroll">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                                <TableHead className="font-extrabold text-xs uppercase tracking-wider">Bahan</TableHead>
                                                <TableHead className="font-extrabold text-xs uppercase tracking-wider">Qty Dipakai</TableHead>
                                                <TableHead className="font-extrabold text-xs uppercase tracking-wider">Stok Sekarang</TableHead>
                                                <TableHead className="font-extrabold text-xs uppercase tracking-wider">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {usages.map((row) => {
                                                const aman = row.stok_sekarang >= row.qty_dipakai;
                                                return (
                                                    <TableRow key={row.bahan_id} className="hover:bg-muted/30 transition-colors">
                                                        <TableCell className="py-3 px-3 text-sm">
                                                            <span className="font-medium">{row.nama_bahan ?? 'Bahan dihapus'}</span>
                                                            {row.kode_bahan && (
                                                                <span className="ml-1.5 text-xs text-muted-foreground">{row.kode_bahan}</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-3 px-3 text-sm font-medium">
                                                            {row.qty_dipakai} {row.satuan ?? ''}
                                                        </TableCell>
                                                        <TableCell className="py-3 px-3 text-sm">
                                                            {row.stok_sekarang} {row.satuan ?? ''}
                                                        </TableCell>
                                                        <TableCell className="py-3 px-3">
                                                            {aman ? (
                                                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                                                    Cukup
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                                                    <TriangleAlert className="h-3 w-3 mr-1" />
                                                                    Stok di bawah pemakaian
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-2">
                            Stok yang ditampilkan adalah stok bahan terkini, pembandingnya pemakaian di batch ini.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ProductionUsage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Detail Bahan Batch', href: '#' },
    ],
};
