import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatRupiah, formatRupiahCompact } from '@/lib/utils';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowDownUp,
    AlertTriangle,
    Calendar,
    ArrowRight,
    ShoppingBag,
    Package,
    ShieldAlert,
    Filter,
    Percent,
    PieChart as PieIcon,
    Users,
    CookingPot,
    Scale,
    Split,
    ClipboardList,
    Sparkles,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    ComposedChart,
    Line
} from 'recharts';

interface MetricProps {
    saldoKas: number;
    labaBersih: number;
    preOrderAktif: number;
    splitOutstanding: number;
}

interface IncomeTrendProps {
    name: string;
    amount: number;
}

interface CashFlowTrendProps {
    name: string;
    inflow: number;
    outflow: number;
    net: number;
}

interface OutflowBreakdownProps {
    name: string;
    value: number;
}

interface CashFlowComparisonProps {
    name: string;
    value: number;
}

interface LabaRugiBreakdownProps {
    pendapatan: number;
    hpp: number;
    operasional: number;
    labaBersih: number;
}

interface ManufacturingEfficiencyProps {
    produksiHpp: number;
    bahanBakuDipakaiCost: number;
}

interface MiniBalanceSheetProps {
    totalAset: number;
    kewajiban: number;
    ekuitas: number;
    totalPasiva: number;
}

interface PartnerProps {
    nama: string;
    total_amount: number;
}

interface BestSellerProps {
    nama: string;
    total_qty: string | number;
    total_revenue: string | number;
}

interface CriticalMaterialProps {
    id: number;
    nama: string;
    stok: number;
    satuan: string;
}

interface PartnerBalanceProps {
    id: number;
    nama: string;
    kode: string;
    user_id?: number | null;
    email?: string | null;
    dibayar: number;
    bagian: number;
    saldo: number;
}

interface NeededMaterialProps {
    id: number;
    nama: string;
    satuan: string;
    stok_sekarang: number;
    kebutuhan_po: number;
    kekurangan: number;
}

interface Props {
    startDate: string;
    endDate: string;
    timelineTemplate: '30_days' | 'week' | 'month' | 'year' | 'custom';
    metrics: MetricProps;
    incomeTrend: IncomeTrendProps[];
    cashFlowTrend: CashFlowTrendProps[];
    outflowBreakdown: OutflowBreakdownProps[];
    cashFlowComparison: CashFlowComparisonProps[];
    labaRugiBreakdown: LabaRugiBreakdownProps;
    manufacturingEfficiency: ManufacturingEfficiencyProps;
    miniBalanceSheet: MiniBalanceSheetProps;
    topCustomers: PartnerProps[];
    topSuppliers: PartnerProps[];
    bestSellers: BestSellerProps[];
    criticalMaterials: CriticalMaterialProps[];
    neededMaterials?: NeededMaterialProps[];
    partnerBalances?: PartnerBalanceProps[];
}

export default function Dashboard({
    startDate: initialStartDate,
    endDate: initialEndDate,
    timelineTemplate: initialTemplate,
    metrics,
    incomeTrend,
    cashFlowTrend,
    outflowBreakdown,
    cashFlowComparison,
    labaRugiBreakdown,
    manufacturingEfficiency,
    miniBalanceSheet,
    topCustomers,
    topSuppliers,
    bestSellers,
    criticalMaterials,
    neededMaterials = [],
    partnerBalances = [],
}: Props) {
    const [template, setTemplate] = useState(initialTemplate);
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);

    const handleTemplateChange = (val: '30_days' | 'week' | 'month' | 'year' | 'custom') => {
        setTemplate(val);
        if (val !== 'custom') {
            router.visit('/dashboard', {
                data: { timeline_template: val },
                preserveState: false,
            });
        }
    };

    const handleApplyFilter = () => {
        router.visit('/dashboard', {
            data: { timeline_template: 'custom', start_date: startDate, end_date: endDate },
            preserveState: false,
        });
    };

    // Colors
    const DOUGHNUT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#a855f7', '#f59e0b', '#ec4899'];
    const COMPARISON_COLORS = ['#3b82f6', '#ef4444', '#14b8a6'];
    const LABARUGI_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981'];

    // Laba/Rugi Chart
    const labaRugiData = [
        { name: 'Laba Bersih', value: Math.max(0, labaRugiBreakdown.labaBersih) },
        { name: 'Nilai HPP', value: labaRugiBreakdown.hpp },
        { name: 'Pengeluaran', value: labaRugiBreakdown.operasional },
    ];

    const hppPercentage = labaRugiBreakdown.pendapatan > 0 ? (labaRugiBreakdown.hpp / labaRugiBreakdown.pendapatan) * 100 : 0;
    const operasionalPercentage = labaRugiBreakdown.pendapatan > 0 ? (labaRugiBreakdown.operasional / labaRugiBreakdown.pendapatan) * 100 : 0;
    const labaPercentage = labaRugiBreakdown.pendapatan > 0 ? (labaRugiBreakdown.labaBersih / labaRugiBreakdown.pendapatan) * 100 : 0;

    // Manufacturing Efficiency Chart
    const efficiencyData = [
        {
            name: 'Manufaktur',
            'Produk Jadi (HPP)': manufacturingEfficiency.produksiHpp,
            'Bahan Baku Dipakai': manufacturingEfficiency.bahanBakuDipakaiCost,
        }
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover text-popover-foreground border rounded-lg shadow-md p-3 text-xs">
                    <p className="font-semibold mb-1 text-muted-foreground">{label}</p>
                    <div className="space-y-1">
                        <p className="flex justify-between gap-4">
                            <span className="text-primary font-medium">Jumlah:</span>
                            <span className="font-bold">{formatRupiah(payload[0].value)}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const CustomBestSellerTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover text-popover-foreground border rounded-lg shadow-md p-2.5 text-xs">
                    <p className="font-semibold text-emerald-500">{payload[0].payload.nama}</p>
                    <p className="mt-1">
                        Terjual: <span className="font-bold">{payload[0].value} pcs</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomCashFlowTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover text-popover-foreground border rounded-lg shadow-md p-3 text-xs">
                    <p className="font-semibold mb-1 text-muted-foreground">{label}</p>
                    <div className="space-y-1">
                        <p className="flex justify-between gap-4">
                            <span className="text-green-500 font-medium">Kas Masuk:</span>
                            <span className="font-bold">{formatRupiah(payload[0].value)}</span>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-destructive font-medium">Kas Keluar:</span>
                            <span className="font-bold">{formatRupiah(Math.abs(payload[1].value))}</span>
                        </p>
                        <p className="flex justify-between gap-4 border-t pt-1 mt-1">
                            <span className="text-primary font-medium">Kas Bersih:</span>
                            <span className="font-bold">{formatRupiah(payload[2].value)}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <Head title="Dapur Gabin" />
            <div className="flex h-full flex-1 flex-col gap-5 p-3.5 sm:p-5 md:p-6">

                {/* Mobile Quick Action Buttons (Khusus Layar Smartphone) */}
                <div className="block md:hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-primary" /> Aksi Cepat
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">Operasional Langsung</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        <Link
                            href="/sales/create"
                            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-card border-2 border-primary/25 shadow-xs hover:border-primary active:scale-95 transition-all text-center group"
                        >
                            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-extrabold leading-tight text-foreground truncate max-w-full">+ Pesanan</span>
                        </Link>
                        <Link
                            href="/purchases/create"
                            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-card border border-border shadow-xs hover:border-emerald-500 active:scale-95 transition-all text-center group"
                        >
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Package className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-extrabold leading-tight text-foreground truncate max-w-full">+ Belanja</span>
                        </Link>
                        <Link
                            href="/productions"
                            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-card border border-border shadow-xs hover:border-amber-500 active:scale-95 transition-all text-center group"
                        >
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <CookingPot className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-extrabold leading-tight text-foreground truncate max-w-full">Produksi</span>
                        </Link>
                        <Link
                            href="/split-bills"
                            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-card border border-border shadow-xs hover:border-purple-500 active:scale-95 transition-all text-center group"
                        >
                            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-1 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Split className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-extrabold leading-tight text-foreground truncate max-w-full">Patungan</span>
                        </Link>
                    </div>
                </div>

                {/* Header Filter Section */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
                    <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-extrabold tracking-[0.14em] text-primary uppercase">
                            <Sparkles className="h-3.5 w-3.5" />
                            dapur gabin
                        </div>
                        <h1 className="mt-1.5 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                            Halo, partner gabin! 👋
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Ini kondisi dapur hari ini. Uangnya aman? Semoga iya, biar es krimnya tetap lumer.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                        <div className="w-full sm:w-48">
                            <Select value={template} onValueChange={(val: any) => handleTemplateChange(val)}>
                                <SelectTrigger className="h-10 bg-card rounded-xl w-full">
                                    <SelectValue placeholder="Pilih Timeline" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30_days">30 Hari Terakhir</SelectItem>
                                    <SelectItem value="week">Minggu Ini</SelectItem>
                                    <SelectItem value="month">Bulan Ini</SelectItem>
                                    <SelectItem value="year">Tahun Ini</SelectItem>
                                    <SelectItem value="custom">Kustomisasi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {template === 'custom' && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border bg-card p-2.5 shadow-xs w-full sm:w-auto animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="grid grid-cols-2 gap-1.5 flex-1">
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="h-9 w-full rounded-lg text-xs"
                                        />
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="h-9 w-full rounded-lg text-xs"
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleApplyFilter} size="sm" className="h-9 px-3 rounded-lg flex items-center justify-center gap-1.5 w-full sm:w-auto">
                                    <Filter className="h-3.5 w-3.5" /> Terapkan
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Metrics Cards Grid - 2 Kolom di Smartphone, 4 Kolom di Desktop */}
                <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                    <Card className="overflow-hidden shadow-xs rounded-2xl border border-border/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3 sm:p-5">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Dompet Kas</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
                            <div className="text-sm sm:text-xl font-extrabold truncate">{formatRupiah(metrics.saldoKas)}</div>
                            <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Saldo akhir filter</p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden shadow-xs rounded-2xl border border-border/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3 sm:p-5">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Cuan Bersih</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
                            <div className={`text-sm sm:text-xl font-extrabold truncate ${metrics.labaBersih >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                                {formatRupiah(metrics.labaBersih)}
                            </div>
                            <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Laba/rugi periode</p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden shadow-xs rounded-2xl border border-border/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3 sm:p-5">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Pesanan Nunggu</CardTitle>
                            <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
                            <div className="text-sm sm:text-xl font-extrabold text-primary truncate">{formatRupiah(metrics.preOrderAktif)}</div>
                            <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Pesanan belum selesai</p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden shadow-xs rounded-2xl border border-border/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3 sm:p-5">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Patungan Gantung</CardTitle>
                            <Split className="h-4 w-4 text-amber-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
                            <div className="text-sm sm:text-xl font-extrabold text-amber-600 dark:text-amber-400 truncate">{formatRupiah(metrics.splitOutstanding)}</div>
                            <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Talangan belum kembali</p>
                        </CardContent>
                    </Card>
                </div>

                {/* ROW 2: Laba/Rugi Donut, Income Line Chart, Cash Flow Donut */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">

                    {/* Laba / Rugi Donut Chart Widget */}
                    <Card className="shadow-sm overflow-hidden flex flex-col p-0 gap-0 min-h-[380px]">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Percent className="h-4 w-4 text-emerald-500" />
                                Laba/Rugi Periode Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col justify-between">
                            <div className="h-48 w-full flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={labaRugiData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {labaRugiData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COMPARISON_COLORS[index]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Laba Bersih</span>
                                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                        {labaPercentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4 text-xs">
                                <div className="flex justify-between items-center py-1 border-b">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <span className="h-2 w-2 rounded-full bg-blue-500" /> Pendapatan
                                    </span>
                                    <span className="font-bold">{formatRupiah(labaRugiBreakdown.pendapatan)}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <span className="h-2 w-2 rounded-full bg-orange-500" /> Nilai HPP
                                    </span>
                                    <span className="font-bold">
                                        {formatRupiah(labaRugiBreakdown.hpp)} ({hppPercentage.toFixed(0)}%)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <span className="h-2 w-2 rounded-full bg-red-500" /> Pengeluaran
                                    </span>
                                    <span className="font-bold">
                                        {formatRupiah(labaRugiBreakdown.operasional)} ({operasionalPercentage.toFixed(0)}%)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-1 font-bold text-emerald-600 dark:text-emerald-400">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Laba
                                    </span>
                                    <span>{formatRupiah(labaRugiBreakdown.labaBersih)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pendapatan Harian Line Chart */}
                    <Card className="shadow-sm overflow-hidden flex flex-col p-0 gap-0 min-h-[380px]">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                Pendapatan Harian
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col justify-between">
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={incomeTrend}
                                        margin={{ top: 10, right: 5, left: 5, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="incomeColor" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            className="text-[10px] fill-muted-foreground"
                                        />
                                        <ChartTooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#3b82f6"
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#incomeColor)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comparison Donut Chart */}
                    <Card className="shadow-sm overflow-hidden flex flex-col p-0 gap-0 min-h-[380px]">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <PieIcon className="h-4 w-4 text-teal-500" />
                                Perbandingan Arus Kas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col justify-between">
                            <div className="h-48 w-full flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={cashFlowComparison}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {cashFlowComparison.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COMPARISON_COLORS[index]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] text-center">
                                {cashFlowComparison.map((item, index) => (
                                    <div key={index} className="space-y-1">
                                        <span className="block font-semibold text-muted-foreground truncate">{item.name}</span>
                                        <span className="block font-bold text-foreground text-xs" style={{ color: COMPARISON_COLORS[index] }}>
                                            {formatRupiah(item.value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* ROW 3: Stacked Cash Flow (Double Sided) & Largest Outcomes */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">

                    {/* Two-Way Cash Flow Bar Chart */}
                    <Card className="shadow-sm overflow-hidden flex flex-col p-0 gap-0 lg:col-span-2 min-h-[420px]">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <ArrowDownUp className="h-4 w-4 text-primary" />
                                Arus Kas Masuk vs Keluar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart
                                        data={cashFlowTrend}
                                        margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            className="text-[10px] fill-muted-foreground"
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            className="text-[10px] fill-muted-foreground"
                                            tickFormatter={formatRupiahCompact}
                                        />
                                        <ChartTooltip content={<CustomCashFlowTooltip />} />
                                        <Legend
                                            verticalAlign="top"
                                            height={36}
                                            iconType="circle"
                                            className="text-xs"
                                        />
                                        <Bar
                                            name="Kas Masuk"
                                            dataKey="inflow"
                                            fill="#10b981"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={30}
                                        />
                                        <Bar
                                            name="Kas Keluar"
                                            dataKey="outflow"
                                            fill="#ef4444"
                                            radius={[0, 0, 4, 4]}
                                            maxBarSize={30}
                                        />
                                        <Line
                                            name="Kas Bersih"
                                            type="monotone"
                                            dataKey="net"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Largest Outcomes Pie Chart */}
                    <Card className="shadow-sm overflow-hidden flex flex-col p-0 gap-0 min-h-[420px]">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-destructive" />
                                Pengeluaran Terbesar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col justify-between">
                            <div className="h-48 w-full flex items-center justify-center relative">
                                {outflowBreakdown.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={outflowBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={75}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {outflowBreakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={DOUGHNUT_COLORS[index % DOUGHNUT_COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center text-xs text-muted-foreground py-8">
                                        Tidak ada data pengeluaran dalam periode ini.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5 mt-4 text-[11px] max-h-36 overflow-y-auto pr-1">
                                {outflowBreakdown.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-1 border-b">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <span
                                                className="h-2.5 w-2.5 rounded-full"
                                                style={{ backgroundColor: DOUGHNUT_COLORS[index % DOUGHNUT_COLORS.length] }}
                                            />
                                            {item.name}
                                        </span>
                                        <span className="font-bold text-foreground">{formatRupiah(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* ROW 4: Best Sellers, Manufacture Efficiency, Mini Balance Sheet */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">

                    {/* Top Products Horizontal Bar Chart */}
                    <Card className="shadow-sm overflow-hidden flex flex-col p-0 gap-0 min-h-[380px] lg:col-span-2">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-emerald-500" />
                                Peringkat Produk Terlaris (Qty)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col justify-between">
                            <div className="h-64 w-full">
                                {bestSellers.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            layout="vertical"
                                            data={bestSellers}
                                            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                                            <XAxis type="number" axisLine={false} tickLine={false} className="text-[10px] fill-muted-foreground" />
                                            <YAxis dataKey="nama" type="category" axisLine={false} tickLine={false} className="text-xs font-semibold fill-foreground" width={120} />
                                            <ChartTooltip content={<CustomBestSellerTooltip />} />
                                            <Bar dataKey="total_qty" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={25} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center text-xs text-muted-foreground py-8">
                                        Tidak ada data penjualan pada periode ini.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Manufacturing Efficiency Chart */}
                    <Card className="shadow-sm overflow-hidden flex flex-col p-0 gap-0 min-h-[380px]">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <CookingPot className="h-4 w-4 text-amber-500" />
                                Efisiensi Manufaktur
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col justify-between">
                            <div className="h-52 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={efficiencyData}
                                        margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs font-semibold fill-muted-foreground" />
                                        <YAxis axisLine={false} tickLine={false} className="text-[10px] fill-muted-foreground" tickFormatter={formatRupiahCompact} />
                                        <ChartTooltip formatter={(value: any) => formatRupiah(value)} />
                                        <Legend verticalAlign="top" height={36} iconType="circle" className="text-xs" />
                                        <Bar name="HPP Hasil Produksi" dataKey="Produk Jadi (HPP)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar name="Biaya Bahan Baku" dataKey="Bahan Baku Dipakai" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-center text-[10px] text-muted-foreground mt-2">
                                Rasio output produksi terhadap konsumsi bahan baku.
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* ROW 5: Mini Balance Sheet & Top Business Partners */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">

                    {/* Stacked Balance Sheet Chart */}
                    <Card className="shadow-sm overflow-hidden flex flex-col p-0 gap-0 min-h-[300px] lg:col-span-2">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Scale className="h-4 w-4 text-primary" />
                                Posisi Neraca Mini (Harta vs Pasiva)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col justify-between">
                            <div className="h-40 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={[
                                            {
                                                name: 'Aktiva (Aset)',
                                                Aset: miniBalanceSheet.totalAset,
                                            },
                                            {
                                                name: 'Pasiva (Kew & Eku)',
                                                Kewajiban: miniBalanceSheet.kewajiban,
                                                Ekuitas: miniBalanceSheet.ekuitas,
                                            }
                                        ]}
                                        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                                        <XAxis type="number" axisLine={false} tickLine={false} className="text-[10px] fill-muted-foreground" tickFormatter={formatRupiahCompact} />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} className="text-xs font-bold fill-foreground" width={110} />
                                        <ChartTooltip formatter={(value: any) => formatRupiah(value)} />
                                        <Legend verticalAlign="top" height={36} iconType="circle" className="text-xs" />
                                        <Bar name="Aset Lancar + Tetap" dataKey="Aset" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20} />
                                        <Bar name="Kewajiban (Hutang)" dataKey="Kewajiban" stackId="a" fill="#ef4444" maxBarSize={20} />
                                        <Bar name="Ekuitas (Modal & Laba)" dataKey="Ekuitas" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-center text-[10px] text-muted-foreground">
                                Membandingkan total kekayaan (Aset) dengan total sumber pendanaan (Hutang & Modal).
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Partners (Customers & Suppliers) */}
                    <Card className="shadow-sm overflow-hidden flex flex-col p-0 gap-0 min-h-[300px]">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                Mitra Bisnis Teratas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col justify-between gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Pelanggan Terbesar</h4>
                                    <div className="space-y-2">
                                        {topCustomers.length > 0 ? (
                                            topCustomers.map((c, i) => (
                                                <div key={i} className="flex flex-col border-b pb-1">
                                                    <span className="font-semibold text-xs text-foreground truncate">{c.nama}</span>
                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(c.total_amount)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[10px] text-muted-foreground">Tidak ada transaksi.</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Pemasok Terbesar</h4>
                                    <div className="space-y-2">
                                        {topSuppliers.length > 0 ? (
                                            topSuppliers.map((s, i) => (
                                                <div key={i} className="flex flex-col border-b pb-1">
                                                    <span className="font-semibold text-xs text-foreground truncate">{s.nama}</span>
                                                    <span className="text-[10px] text-destructive font-bold">{formatRupiah(s.total_amount)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[10px] text-muted-foreground">Tidak ada transaksi.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* ROW 6: Critical Materials & Receivables */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">

                    {/* Critical Materials */}
                    <Card className="shadow-sm overflow-hidden p-0 gap-0">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Package className="h-4 w-4 text-amber-500" />
                                Stok Bahan Baku Kritis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {criticalMaterials.length > 0 ? (
                                criticalMaterials.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg border bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-400">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span className="font-semibold">{item.nama}</span>
                                        </div>
                                        <span className="font-bold bg-amber-500/20 px-2 py-0.5 rounded text-amber-700 dark:text-amber-300">
                                            Sisa {item.stok} {item.satuan}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-xs text-muted-foreground py-4">
                                    Semua stok bahan baku aman.
                                </div>
                            )}
                            <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                                <Link href="/materials">
                                    Kelola Bahan Baku
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Split Bill Partner Settlement Status */}
                    <Card className="shadow-sm overflow-hidden p-0 gap-0">
                        <CardHeader className="border-b bg-muted/40 pt-6 pb-4 px-6">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Split className="h-4 w-4 text-primary" />
                                Saldo Split Bill Partner
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {partnerBalances.length > 0 ? (
                                partnerBalances.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg border bg-muted/20">
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-foreground">{item.kode} — {item.nama}</p>
                                            <p className="text-muted-foreground text-[10px]">
                                                Total talangan belanja: {formatRupiah(item.dibayar)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`font-bold text-xs ${item.saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                {item.saldo >= 0 ? `+${formatRupiah(item.saldo)} (Piutang)` : `${formatRupiah(item.saldo)} (Wajib ganti)`}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-xs text-muted-foreground py-4">
                                    Belum ada data split bill belanja.
                                </div>
                            )}
                            <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                                <Link href="/split-bills">
                                    Buka Menu Split Bill
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                </div>

            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
