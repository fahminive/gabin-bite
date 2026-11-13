import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Users } from 'lucide-react';
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

    const grup: Array<{ label: string; items: NavItem[] }> = [
        { label: 'Ruang Utama', items: mainNavItems },
        ...(userRole === 'admin'
            ? [
                  {
                      label: 'Bos Besar',
                      items: [{ title: 'Tim Gabin', href: users.index(), icon: Users } as NavItem],
                  },
              ]
            : []),
        {
            label: 'Data Dapur',
            items: [
                { title: 'Bahan Baku', href: materials.index(), icon: null },
                { title: 'Produk', href: products.index(), icon: null },
                { title: 'Pemasok', href: suppliers.index(), icon: null },
                { title: 'Batch Pre-Order', href: preOrders.index(), icon: null },
                { title: 'Pelanggan', href: customers.index(), icon: null },
                { title: 'Metode Pembayaran', href: paymentMethods.index(), icon: null },
            ],
        },
        {
            label: 'Jual-Jualan',
            items: [
                { title: 'Daftar PO Penjualan', href: sales.index(), icon: null },
                { title: 'Rute Pengantaran', href: '/delivery-route', icon: null },
            ],
        },
        {
            label: 'Duit & Dompet',
            items: [
                { title: 'Kas', href: cash.index(), icon: null },
                { title: 'Modal', href: modals.index(), icon: null },
                { title: 'Patungan Partner', href: '/split-bills', icon: null },
            ],
        },
        {
            label: 'Belanja',
            items: [{ title: 'Belanja Bahan (PO)', href: purchases.index(), icon: null }],
        },
        {
            label: 'Bikin Gabin',
            items: [
                { title: 'Produksi Gabin', href: productions.index(), icon: null },
                { title: 'Hitung Ulang Stok', href: stockCorrections.index(), icon: null },
            ],
        },
        {
            label: 'Laporan Cuan',
            items: [
                { title: 'Cuan / Boncos', href: reports.incomeStatement(), icon: null },
                { title: 'Uang Masuk-Keluar', href: reports.cashFlow(), icon: null },
                { title: 'Kesehatan Dompet', href: reports.balanceSheet(), icon: null },
            ],
        },
    ];

    return (
        <Drawer
            open={terbuka}
            onOpenChange={setTerbuka}
            /* repositionable = bisa ditarik ke atas jadi fullscreen */
        >
            <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Buka menu">
                    <LayoutGrid className="h-5 w-5" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[70vh] max-h-[96vh] rounded-t-3xl bg-sidebar text-sidebar-foreground select-none [--initial-height:70vh]">
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
                                                    'flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-3 text-center transition-colors active:scale-95',
                                                    aktif
                                                        ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                                                        : 'text-sidebar-foreground/90 active:bg-sidebar-accent',
                                                )}
                                            >
                                                {item.icon ? (
                                                    <item.icon className="h-5 w-5" />
                                                ) : (
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-primary/15 text-[10px] font-bold">
                                                        {item.title.slice(0, 1)}
                                                    </span>
                                                )}
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
