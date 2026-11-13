import { Head } from '@inertiajs/react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
    PieChart,
    Pie,
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
    topProduk: Array<{ nama: string; qty: number; omzet: number }>;
}

const formatRupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

/** format rupiah singkat utk axis chart */
const formatRupiahShort = (value: number) => {
    if (Math.abs(value) >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}jt`;
    }
    if (Math.abs(value) >= 1_000) {
        return `${Math.round(value / 1_000)}rb`;
    }
    return String(Math.round(value));
};

export default function DashboardIndex({ batchTrend, summary, lowStockBahan, lowStockProduk, topProduk }: Props) {
    const chartData = batchTrend
        .map((b) => ({
            kode: b.kode.replace(/^PO-?/i, ''),
            Omzet: b.omzet,
            Laba: Math.max(b.laba, 0),
        }))
        .reverse();

    // Margin per batch (%) - hanya batch yang sudah ada pendapatan serah
    const marginData = batchTrend
        .filter((b) => b.pendapatan > 0)
        .map((b) => ({
            kode: b.kode.replace(/^PO-?/i, ''),
            Margin: Math.max(0, Math.round((b.laba / b.pendapatan) * 100)),
        }))
        .reverse();

    // Warna pie tetap per index
    const PIE_COLORS = ['#E94F87', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9'];

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-4 p-3 md:p-6">
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

                {/* ===== Margin per batch ===== */}
                <Card className="rounded-2xl shadow-xs">
                    <CardHeader className="px-4 pt-4 pb-1 md:px-6 md:pt-5">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold md:text-base">
                            <Percent className="h-4 w-4 text-primary" />
                            Margin per Batch PO (%)
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground md:text-xs">
                            laba dibagi pendapatan serah terima; batch di bawah 30% perlu dicek harga/HPP
                        </p>
                    </CardHeader>
                    <CardContent className="px-2 pb-3 md:px-6 md:pb-5">
                        {marginData.length === 0 ? (
                            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                                Belum ada batch yang diserahkan.
                            </p>
                        ) : (
                            <div className="h-44 w-full md:h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={marginData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                        <XAxis dataKey="kode" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                        <YAxis
                                            tickFormatter={(v) => `${v}%`}
                                            tick={{ fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={40}
                                            domain={[0, 100]}
                                        />
                                        <Tooltip
                                            formatter={(value) => `${value}%`}
                                            contentStyle={{
                                                borderRadius: 12,
                                                border: '1px solid var(--border)',
                                                background: 'var(--card)',
                                                fontSize: 12,
                                            }}
                                        />
                                        <Bar dataKey="Margin" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                            {marginData.map((entry, i) => (
                                                <Cell
                                                    key={`cell-${i}`}
                                                    fill={entry.Margin >= 30 ? '#10b981' : entry.Margin > 0 ? '#f59e0b' : '#ef4444'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ===== Produk terlaris: qty + komposisi omzet ===== */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <Card className="rounded-2xl shadow-xs">
                        <CardHeader className="px-4 pt-4 pb-1 md:px-6 md:pt-5">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold md:text-base">
                                <PackageSearch className="h-4 w-4 text-primary" />
                                Produk Terlaris (qty)
                            </CardTitle>
                            <p className="text-[11px] text-muted-foreground md:text-xs">
                                5 varian paling banyak terjual (basis serah terima)
                            </p>
                        </CardHeader>
                        <CardContent className="px-2 pb-3 md:px-6 md:pb-5">
                            {(!topProduk || topProduk.length === 0) ? (
                                <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                                    Belum ada penjualan yang diserahkan.
                                </p>
                            ) : (
                                <div className="h-44 w-full md:h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={topProduk}
                                            layout="vertical"
                                            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                            <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis
                                                type="category"
                                                dataKey="nama"
                                                width={96}
                                                tick={{ fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                formatter={(value) => `${value} pcs`}
                                                contentStyle={{
                                                    borderRadius: 12,
                                                    border: '1px solid var(--border)',
                                                    background: 'var(--card)',
                                                    fontSize: 12,
                                                }}
                                            />
                                            <Bar dataKey="qty" fill="#E94F87" radius={[0, 4, 4, 0]} maxBarSize={22} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-xs">
                        <CardHeader className="px-4 pt-4 pb-1 md:px-6 md:pt-5">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold md:text-base">
                                <Split className="h-4 w-4 text-primary" />
                                Komposisi Omzet per Produk
                            </CardTitle>
                            <p className="text-[11px] text-muted-foreground md:text-xs">
                                kontribusi tiap varian terhadap omzet total
                            </p>
                        </CardHeader>
                        <CardContent className="px-2 pb-3 md:px-6 md:pb-5">
                            {(!topProduk || topProduk.length === 0) ? (
                                <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                                    Belum ada penjualan yang diserahkan.
                                </p>
                            ) : (
                                <div className="flex h-44 items-center md:h-52">
                                    <div className="h-full w-1/2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={topProduk}
                                                    dataKey="omzet"
                                                    nameKey="nama"
                                                    innerRadius="52%"
                                                    outerRadius="86%"
                                                    paddingAngle={2}
                                                    strokeWidth={0}
                                                >
                                                    {topProduk.map((_, i) => (
                                                        <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value) => formatRupiah(Number(value))}
                                                    contentStyle={{
                                                        borderRadius: 12,
                                                        border: '1px solid var(--border)',
                                                        background: 'var(--card)',
                                                        fontSize: 12,
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex w-1/2 flex-col gap-1.5 pl-2">
                                        {topProduk.map((p, i) => (
                                            <div key={p.nama} className="flex items-center gap-1.5 text-[11px]">
                                                <span
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                                                />
                                                <span className="min-w-0 flex-1 truncate font-semibold">{p.nama}</span>
                                                <span className="shrink-0 text-muted-foreground">{formatRupiahShort(p.omzet)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

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
