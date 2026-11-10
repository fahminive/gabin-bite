import { Head } from '@inertiajs/react';
import {
    Coins,
    CookingPot,
    PackageCheck,
    ShoppingBag,
    Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BahanPembatas {
    nama: string;
    satuan: string;
    max: number;
}

interface ProductRow {
    id: number;
    kode: string;
    nama_produk: string;
    satuan: string;
    stok_saat_ini: number;
    terjual_seumur_hidup: number;
    belum_diserahkan: number;
    estimasi_produksi: number | null;
    bahan_pembatas: BahanPembatas | null;
}

interface Props {
    products: ProductRow[];
    summary: {
        totalTerjual: number;
        totalStokProduk: number;
        totalKapasitas: number;
    };
}

function nf(value: number | null) {
    if (value === null) return '—';
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(
        value,
    );
}

export default function Dashboard({ products, summary }: Props) {

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                {/* Header */}
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                        Dashboard Produksi &amp; Penjualan
                    </h1>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        Terjual seumur hidup &amp; estimasi yang masih bisa
                        diproduksi dari bahan yang ada
                    </p>
                </div>

                {/* Ringkasan */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                    <Card className="gap-0 py-3.5 sm:py-4">
                        <CardHeader className="flex-row items-center justify-between space-y-0 px-4 pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                                Terjual seumur hidup
                            </CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-4">
                            <div className="text-lg font-extrabold sm:text-2xl">
                                {nf(summary.totalTerjual)}{' '}
                                <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                                    bungkus
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-0 py-3.5 sm:py-4">
                        <CardHeader className="flex-row items-center justify-between space-y-0 px-4 pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                                Stok produk saat ini
                            </CardTitle>
                            <PackageCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-4">
                            <div className="text-lg font-extrabold sm:text-2xl">
                                {nf(summary.totalStokProduk)}{' '}
                                <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                                    bungkus
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-0 py-3.5 sm:py-4">
                        <CardHeader className="flex-row items-center justify-between space-y-0 px-4 pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                                Kapasitas produksi
                            </CardTitle>
                            <CookingPot className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-4">
                            <div className="text-lg font-extrabold sm:text-2xl">
                                {nf(summary.totalKapasitas)}{' '}
                                <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                                    bungkus
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabel produk */}
                <Card className="gap-0 overflow-hidden py-0">
                    <CardHeader className="border-b bg-muted/40 px-4 pt-4 pb-3 sm:px-6 sm:pt-5">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                            <Coins className="h-4 w-4 text-muted-foreground" />
                            Per Produk — Terjual &amp; Estimasi Produksi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="w-full overflow-x-auto">
                            <Table className="text-xs sm:text-sm">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-3 sm:px-4">
                                            Produk
                                        </TableHead>
                                        <TableHead className="px-2 text-center">
                                            Stok
                                        </TableHead>
                                        <TableHead className="px-2 text-center">
                                            Terjual ⏳
                                        </TableHead>
                                        <TableHead className="px-2 text-center">
                                            Belum diserahkan
                                        </TableHead>
                                        <TableHead className="px-2 text-center">
                                            Bisa diproduksi
                                        </TableHead>
                                        <TableHead className="hidden px-3 sm:table-cell">
                                            Bahan pembatas
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="px-4 py-6 text-center text-muted-foreground"
                                            >
                                                Belum ada produk.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {products.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="max-w-[140px] px-3 py-2 sm:px-4 sm:max-w-[240px]">
                                                <div className="truncate font-medium">
                                                    {p.nama_produk}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground sm:text-xs">
                                                    {p.kode}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-2 py-2 text-center">
                                                {nf(p.stok_saat_ini)}
                                            </TableCell>
                                            <TableCell className="px-2 py-2 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                                                {nf(p.terjual_seumur_hidup)}
                                            </TableCell>
                                            <TableCell className="px-2 py-2 text-center">
                                                {p.belum_diserahkan > 0 ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-amber-600 dark:text-amber-400"
                                                    >
                                                        <Timer className="mr-1 h-3 w-3" />
                                                        {nf(p.belum_diserahkan)}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        0
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-2 py-2 text-center">
                                                {p.estimasi_produksi ===
                                                null ? (
                                                    <span className="text-muted-foreground">
                                                        tidak ada resep
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={cn(
                                                            'rounded px-1.5 py-0.5 font-semibold',
                                                            p.estimasi_produksi >
                                                                0
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                : 'bg-destructive/10 text-destructive',
                                                        )}
                                                    >
                                                        {nf(p.estimasi_produksi)}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden px-3 py-2 sm:table-cell">
                                                {p.bahan_pembatas
                                                    ? `${p.bahan_pembatas.nama} (${nf(p.bahan_pembatas.max)} ${p.bahan_pembatas.satuan})`
                                                    : '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                    <strong>Terjual ⏳</strong> = semua bungkus yang sudah
                    diserahkan ke pembeli (seumur hidup).{' '}
                    <strong>Bisa diproduksi</strong> = pesanan yang masih
                    menunggu serah terima — belum mengurangi stok. Estimasi
                    diproduksi = bahan yang habis paling cepat menentukan batas
                    (stok bahan ÷ qty resep, dibulatkan ke bawah).
                </p>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }],
};
