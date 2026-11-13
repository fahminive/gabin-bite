import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    Users,
    Wheat,
    PackageSearch,
    Truck,
    CalendarDays,
    BookUser,
    BadgeDollarSign,
    Banknote,
    ChartCandlestick,
    Split,
    ShoppingCart,
    CookingPot,
    SearchCheck,
    BookOpenText,
    ArrowDownUp,
    Scale,
    ClipboardList,
    Map,
} from 'lucide-react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import * as materials from '@/actions/App/Http/Controllers/BahanBakuController';
import * as products from '@/actions/App/Http/Controllers/ProdukController';
import * as suppliers from '@/actions/App/Http/Controllers/PemasokController';
import * as customers from '@/actions/App/Http/Controllers/PelangganController';
import * as paymentMethods from '@/actions/App/Http/Controllers/MetodePembayaranController';
import * as cash from '@/actions/App/Http/Controllers/KasController';
import * as modals from '@/actions/App/Http/Controllers/ModalController';
import * as purchases from '@/actions/App/Http/Controllers/PembelianController';
import * as productions from '@/actions/App/Http/Controllers/ProduksiController';
import * as stockCorrections from '@/actions/App/Http/Controllers/KoreksiStokController';
import * as reports from '@/actions/App/Http/Controllers/LaporanController';
import * as preOrders from '@/actions/App/Http/Controllers/PreOrderController';
import * as sales from '@/actions/App/Http/Controllers/PenjualanController';
import * as users from '@/actions/App/Http/Controllers/UserController';
import type { NavItem } from '@/types';

type MenuIcon = NavItem['icon'];

const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
];

export function MobileMenuSheet() {
    const { url } = usePage();
    const [terbuka, setTerbuka] = useState(false);
    const { auth } = usePage().props as any;
    const userRole = auth?.user?.role;

    // Tutup saat navigasi
    useEffect(() => {
        setTerbuka(false);
    }, [url]);

    const grup: Array<{ label: string; items: Array<NavItem & { color?: string }> }> = [
        {
            label: 'Ruang Utama',
            items: [
                { title: 'Dashboard', href: dashboard(), icon: LayoutGrid, color: 'bg-primary/10 text-primary' },
            ],
        },
        ...(userRole === 'admin'
            ? [
                  {
                      label: 'Bos Besar',
                      items: [
                          {
                              title: 'Tim Gabin',
                              href: users.index(),
                              icon: Users as MenuIcon,
                              color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
                          } as NavItem & { color?: string },
                      ],
                  },
              ]
            : []),
        {
            label: 'Data Dapur',
            items: [
                { title: 'Bahan Baku', href: materials.index(), icon: Wheat, color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
                { title: 'Produk', href: products.index(), icon: PackageSearch, color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
                { title: 'Pemasok', href: suppliers.index(), icon: Truck, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400' },
                { title: 'Batch Pre-Order', href: preOrders.index(), icon: CalendarDays, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400' },
                { title: 'Pelanggan', href: customers.index(), icon: BookUser, color: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400' },
                { title: 'Metode Pembayaran', href: paymentMethods.index(), icon: BadgeDollarSign, color: 'bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-400' },
            ],
        },
        {
            label: 'Jual-Jualan',
            items: [
                { title: 'PO Penjualan', href: sales.index(), icon: ClipboardList, color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' },
                { title: 'Rute Pengantaran', href: '/delivery-route', icon: Map, color: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-400' },
            ],
        },
        {
            label: 'Duit & Dompet',
            items: [
                { title: 'Kas', href: cash.index(), icon: Banknote, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
                { title: 'Modal', href: modals.index(), icon: ChartCandlestick, color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400' },
                { title: 'Patungan Partner', href: '/split-bills', icon: Split, color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400' },
            ],
        },
        {
            label: 'Belanja',
            items: [
                { title: 'Belanja Bahan (PO)', href: purchases.index(), icon: ShoppingCart, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
            ],
        },
        {
            label: 'Bikin Gabin',
            items: [
                { title: 'Produksi Gabin', href: productions.index(), icon: CookingPot, color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400' },
                { title: 'Hitung Ulang Stok', href: stockCorrections.index(), icon: SearchCheck, color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' },
            ],
        },
        {
            label: 'Laporan Cuan',
            items: [
                { title: 'Cuan / Boncos', href: reports.incomeStatement(), icon: BookOpenText, color: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400' },
                { title: 'Uang Masuk-Keluar', href: reports.cashFlow(), icon: ArrowDownUp, color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
                { title: 'Kesehatan Dompet', href: reports.balanceSheet(), icon: Scale, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400' },
            ],
        },
    ];

    return (
        <Drawer open={terbuka} onOpenChange={setTerbuka}>
            <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Buka menu">
                    <LayoutGrid className="h-5 w-5" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[70vh] max-h-[96vh] rounded-t-3xl bg-sidebar text-sidebar-foreground select-none">
                <div className="flex h-full flex-col">
                    <DrawerHeader className="shrink-0 px-4 pt-1 pb-2">
                        <DrawerTitle className="text-center text-sm font-bold tracking-wide text-sidebar-foreground/80">
                            Semua Menu
                        </DrawerTitle>
                    </DrawerHeader>
                    <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-1">
                        {grup.map((g) => (
                            <div key={g.label} className="mb-4">
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50">
                                    {g.label}
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {g.items.map((item) => {
                                        const Icon = item.icon;
                                        const href =
                                            typeof item.href === 'string' ? item.href : item.href.url;
                                        const aktif =
                                            href === '/dashboard'
                                                ? url === '/dashboard' || url === '/'
                                                : url.startsWith(href.split('?')[0]);
                                        return (
                                            <Link
                                                key={g.label + item.title}
                                                href={href}
                                                prefetch
                                                onClick={() => setTerbuka(false)}
                                                className={cn(
                                                    'flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2.5 text-center transition-all active:scale-95',
                                                    aktif && 'bg-primary/15 ring-1 ring-primary/30',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'flex h-11 w-11 items-center justify-center rounded-2xl',
                                                        item.color ?? 'bg-primary/10 text-primary',
                                                    )}
                                                >
                                                    {Icon && <Icon className="h-5 w-5" strokeWidth={2} />}
                                                </span>
                                                <span className="line-clamp-2 text-[10px] font-semibold leading-tight">
                                                    {item.title}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
