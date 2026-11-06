import { Head, Link } from '@inertiajs/react';
import { ChefHat, CookingPot, ClipboardList, TriangleAlert, Wheat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usage } from '@/actions/App/Http/Controllers/ProduksiController';

interface Batch {
    id: number;
    tanggal: string;
    qty_hasil: number;
    keterangan: string;
    produk: { nama_produk: string; satuan: string } | null;
    jenis_bahan: number;
    total_bahan_dipakai: number;
}

interface Alert {
    id: number;
    nama: string;
    satuan: string;
    stok: number;
    dibutuhkan: number;
    kurang: number;
}

interface Props {
    productionBatches: Batch[];
    alerts: Alert[];
    metrics: {
        pesananBelumDiserahkan: number;
        bahanKurang: number;
    };
}

function formatDate(tanggal: string | null): string {
    if (!tanggal) return '-';
    const date = new Date(tanggal);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Dashboard({ productionBatches, alerts, metrics }: Props) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-2xl p-3 sm:p-5">

                {/* Header + ringkasan */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Dapur Hari Ini</h1>
                        <p className="text-xs text-muted-foreground">Detail pemakaian bahan per batch produksi &amp; stoknya</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Card className="rounded-2xl border border-border/80 shadow-xs">
                            <CardContent className="p-3 flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                    <div className="text-lg font-extrabold leading-none">{metrics.pesananBelumDiserahkan}</div>
                                    <div className="text-[10px] text-muted-foreground">PO belum diserahkan</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border border-border/80 shadow-xs">
                            <CardContent className="p-3 flex items-center gap-2">
                                <TriangleAlert className={`h-4 w-4 shrink-0 ${metrics.bahanKurang > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
                                <div>
                                    <div className={`text-lg font-extrabold leading-none ${metrics.bahanKurang > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {metrics.bahanKurang}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">Bahan kurang</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Alerting kecukupan bahan */}
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                            <TriangleAlert className="h-4 w-4 text-amber-500" />
                            Alerting Bahan
                            <Badge variant="outline" className="text-[10px]">stok vs kebutuhan PO</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {alerts.length === 0 ? (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Wheat className="h-4 w-4 text-emerald-500" />
                                Semua bahan aman untuk pesanan yang belum diserahan. 👍
                            </p>
                        ) : (
                            <div className="flex flex-col divide-y">
                                {alerts.map((alert) => (
                                    <div key={alert.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                                        <span className="font-medium truncate">{alert.nama} <span className="text-xs text-muted-foreground">({alert.satuan})</span></span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            Stok <b>{alert.stok}</b> · Dibutuhkan <b>{alert.dibutuhkan}</b>
                                        </span>
                                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 shrink-0">
                                            Kurang {alert.kurang}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Kartu batch produksi → detail pemakaian bahan */}
                <div>
                    <h2 className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <ChefHat className="h-4 w-4" /> Batch Produksi Terbaru
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {productionBatches.map((batch) => (
                            <Link key={batch.id} href={usage(batch.id).url}>
                                <Card className="rounded-2xl border border-border/80 shadow-xs hover:border-primary/60 hover:shadow-sm transition-colors h-full">
                                    <CardHeader className="p-4 pb-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <CardTitle className="text-sm font-bold truncate flex items-center gap-1.5">
                                                <CookingPot className="h-3.5 w-3.5 text-primary shrink-0" />
                                                {batch.produk?.nama_produk ?? 'Produk dihapus'}
                                            </CardTitle>
                                            <Badge variant="secondary" className="shrink-0 text-[10px]">
                                                {formatDate(batch.tanggal)}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                                        <p className="truncate">{batch.keterangan || 'Batch produksi'}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                            <span>
                                                Hasil: <b className="text-foreground">{batch.qty_hasil} {batch.produk?.satuan ?? ''}</b>
                                            </span>
                                            <span>
                                                Bahan dipakai: <b className="text-foreground">{batch.total_bahan_dipakai}</b> ({batch.jenis_bahan} jenis)
                                            </span>
                                        </div>
                                        <span className="inline-flex items-center gap-1 mt-2 text-primary font-medium">
                                            Detail bahan →
                                        </span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                    {productionBatches.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-2">Belum ada batch produksi. Catat produksi dulu untuk memicu pemakaian bahan.</p>
                    )}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
    ],
};
