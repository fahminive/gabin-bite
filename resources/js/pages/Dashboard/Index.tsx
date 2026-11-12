import { Head } from '@inertiajs/react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import {
    Wheat,
    PackageSearch,
    ShoppingCart,
    BookOpenText,
    SearchCheck,
    Split,
    TrendingUp,
    Wallet,
    Percent,
    AlertTriangle,
    ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import * as materials from '@/actions/App/Http/Controllers/BahanBakuController';
import * as products from '@/actions/App/Http/Controllers/ProdukController';
import * as purchases from '@/actions/App/Http/Controllers/PembelianController';
import * as stockCorrections from '@/actions/App/Http/Controllers/KoreksiStokController';
import * as reports from '@/actions/App/Http/Controllers/LaporanController';

interface BatchTrend {
    id: number;
    kode: string;
    status: string;
    trx: number;
    omzet: number;
    pendapatan: number;
    laba: number;
}

interface LowStock {
    id: number;
    kode: string;
    nama: string;
    stok: number;
    satuan: string;
}

interface Props {
    batchTrend: BatchTrend[];
    summary: {
        pendapatan: number;
        hpp: number;
        laba: number;
        margin: number;
    };
    lowStockBahan: LowStock[];
    lowStockProduk: LowStock[];
}

const formatRupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

const formatRupiahShort = (value: number) => {
    if (Math.abs(value) >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}jt`;
    }
    if (Math.abs(value) >= 1_000) {
        return `${Math.round(value / 1_000)}rb`;
    }
    return String(Math.round(value));
};

/** 6 menu pinned ala Gojek - hanya tampil di mobile. */
const pinnedMenus = [
    { title: 'Bahan Baku', href: materials.index().url, icon: Wheat, color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
    { title: 'Produk', href: products.index().url, icon: PackageSearch, color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
    { title: 'Belanja PO', href: purchases.index().url, icon: ShoppingCart, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
    { title: 'Cuan/Boncos', href: reports.incomeStatement().url, icon: BookOpenText, color: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400' },
    { title: 'Hitung Ulang', href: stockCorrections.index().url, icon: SearchCheck, color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' },
    { title: 'Split Bill', href: '/split-bills', icon: Split, color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400' },
];

export default function DashboardIndex({ batchTrend, summary, lowStockBahan, lowStockProduk }: Props) {
    const chartData = batchTrend
        .map((b) => ({
            kode: b.kode.replace(/^PO-?/i, ''),
            Omzet: b.omzet,
            Laba: Math.max(b.laba, 0),
        }))
        .reverse();

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-4 p-3 md:p-6">
                {/* ===== Icon menu ala Gojek (hanya mobile) ===== */}
                <div className="md:hidden rounded-2xl border border-border/70 bg-card p-3 shadow-xs">
                    <div className="grid grid-cols-3 gap-x-2 gap-y-3">
                        {pinnedMenus.map((menu) => {
                            const Icon = menu.icon;
                            return (
                                <Link
                                    key={menu.title}
                                    href={menu.href}
                                    className="flex flex-col items-center gap-1.5 rounded-xl py-1 transition-colors active:bg-muted/50 touch-manipulation"
                                >
                                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${menu.color}`}>
                                        <Icon className="h-5 w-5" strokeWidth={2} />
                                    </span>
                                    <span className="text-[11px] font-semibold leading-tight text-center">
                                        {menu.title}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* ===== Ringkasan cuan ===== */}
                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                    <Card className="gap-1 rounded-2xl p-3 shadow-xs md:gap-2 md:p-4">
                        <CardHeader className="p-0 pb-1">
                            <CardTitle className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground md:text-xs">
                                <Wallet className="h-3.5 w-3.5" />
                                Pendapatan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="text-base font-bold md:text-xl">{formatRupiah(summary.pendapatan)}</p>
                            <p className="text-[10px] text-muted-foreground md:text-xs">total seumur hidup</p>
                        </CardContent>
                    </Card>
                    <Card className="gap-1 rounded-2xl p-3 shadow-xs md:gap-2 md:p-4">
                        <CardHeader className="p-0 pb-1">
                            <CardTitle className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground md:text-xs">
                                <TrendingUp className="h-3.5 w-3.5" />
                                Laba Bersih
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 md:text-xl">
                                {formatRupiah(summary.laba)}
                            </p>
                            <p className="text-[10px] text-muted-foreground md:text-xs">
                                HPP {formatRupiah(summary.hpp)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="gap-1 rounded-2xl p-3 shadow-xs md:gap-2 md:p-4">
                        <CardHeader className="p-0 pb-1">
                            <CardTitle className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground md:text-xs">
                                <Percent className="h-3.5 w-3.5" />
                                Margin
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className={`text-base font-bold md:text-xl ${summary.margin >= 30 ? 'text-emerald-600 dark:text-emerald-400' : summary.margin > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'}`}>
                                {summary.margin}%
                            </p>
                            <p className="text-[10px] text-muted-foreground md:text-xs">laba per pendapatan</p>
                        </CardContent>
                    </Card>
                    <Card className="gap-1 rounded-2xl border-amber-500/30 bg-amber-500/5 p-3 shadow-xs md:gap-2 md:p-4 dark:bg-amber-500/10">
                        <CardHeader className="p-0 pb-1">
                            <CardTitle className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 md:text-xs dark:text-amber-400">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Stok Menipis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="text-base font-bold md:text-xl">
                                {lowStockBahan.length + lowStockProduk.length}
                            </p>
                            <p className="text-[10px] text-muted-foreground md:text-xs">
                                {lowStockBahan.length} bahan, {lowStockProduk.length} produk
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ===== Grafik tren per batch ===== */}
                <Card className="rounded-2xl shadow-xs">
                    <CardHeader className="px-4 pt-4 pb-1 md:px-6 md:pt-5">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold md:text-base">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Tren Penjualan per Batch PO
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground md:text-xs">
                            omzet semua transaksi vs laba dari yang sudah diserahkan (6 batch terakhir)
                        </p>
                    </CardHeader>
                    <CardContent className="px-2 pb-3 md:px-6 md:pb-5">
                        {chartData.length === 0 ? (
                            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                                Belum ada batch pre-order.
                            </p>
                        ) : (
                            <div className="h-52 w-full md:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                        <XAxis
                                            dataKey="kode"
                                            tick={{ fontSize: 11 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={formatRupiahShort}
                                            tick={{ fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={44}
                                        />
                                        <Tooltip
                                            formatter={(value) => formatRupiah(Number(value))}
                                            contentStyle={{
                                                borderRadius: 12,
                                                border: '1px solid var(--border)',
                                                background: 'var(--card)',
                                                fontSize: 12,
                                            }}
                                        />
                                        <Bar dataKey="Omzet" fill="#E94F87" radius={[4, 4, 0, 0]} maxBarSize={36} />
                                        <Bar dataKey="Laba" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        {batchTrend.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5 px-2 md:px-0">
                                {batchTrend.map((b) => (
                                    <Badge
                                        key={b.id}
                                        variant={b.status === 'buka' ? 'secondary' : 'outline'}
                                        className="text-[10px]"
                                    >
                                        {b.kode}: {b.trx} trx
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ===== Stok menipis ===== */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <Card className="rounded-2xl shadow-xs">
                        <CardHeader className="px-4 pt-4 pb-1 md:px-6 md:pt-5">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold md:text-base">
                                <Wheat className="h-4 w-4 text-primary" />
                                Bahan Paling Menipis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 md:px-6">
                            {lowStockBahan.length === 0 ? (
                                <p className="py-4 text-sm text-muted-foreground">Belum ada data bahan.</p>
                            ) : (
                                <div className="flex flex-col divide-y">
                                    {lowStockBahan.map((b) => (
                                        <div key={b.id} className="flex items-center justify-between gap-2 py-2">
                                            <span className="min-w-0 truncate text-sm font-medium">
                                                {b.nama}
                                                <span className="ml-1.5 text-[11px] text-muted-foreground">{b.kode}</span>
                                            </span>
                                            <Badge variant={b.stok <= 0 ? 'destructive' : b.stok < 10 ? 'secondary' : 'outline'} className="shrink-0 text-xs font-bold">
                                                {b.stok} {b.satuan}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Link
                                href={materials.index().url}
                                className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"
                            >
                                Kelola bahan baku
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-xs">
                        <CardHeader className="px-4 pt-4 pb-1 md:px-6 md:pt-5">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold md:text-base">
                                <PackageSearch className="h-4 w-4 text-primary" />
                                Produk Paling Menipis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 md:px-6">
                            {lowStockProduk.length === 0 ? (
                                <p className="py-4 text-sm text-muted-foreground">Belum ada data produk.</p>
                            ) : (
                                <div className="flex flex-col divide-y">
                                    {lowStockProduk.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between gap-2 py-2">
                                            <span className="min-w-0 truncate text-sm font-medium">
                                                {p.nama}
                                                <span className="ml-1.5 text-[11px] text-muted-foreground">{p.kode}</span>
                                            </span>
                                            <Badge variant={p.stok <= 0 ? 'destructive' : p.stok < 10 ? 'secondary' : 'outline'} className="shrink-0 text-xs font-bold">
                                                {p.stok} {p.satuan}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Link
                                href={products.index().url}
                                className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"
                            >
                                Kelola produk
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
