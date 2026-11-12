import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Wheat, PackageSearch, TruckIcon, BookUser, BadgeDollarSign, Banknote, ChartCandlestick, ShoppingCart, CookingPot, SearchCheck, BookOpenText, ArrowDownUp, Scale, Users, Split, CalendarDays, ClipboardList, Map } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
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

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const salesNavItems: NavItem[] = [
    {
        title: 'Daftar PO Penjualan',
        href: sales.index(),
        icon: ClipboardList,
    },
    {
        title: 'Rute Pengantaran',
        href: '/delivery-route',
        icon: Map,
    },
]

const masterDataNavItems: NavItem[] = [
    {
        title: 'Bahan Baku',
        href: materials.index(),
        icon: Wheat,
    },
    {
        title: 'Produk',
        href: products.index(),
        icon: PackageSearch,
    },
    {
        title: 'Pemasok',
        href: suppliers.index(),
        icon: TruckIcon,
    },
    {
        title: 'Batch Pre-Order',
        href: preOrders.index(),
        icon: CalendarDays,
    },
    {
        title: 'Pelanggan',
        href: customers.index(),
        icon: BookUser,
    },
    {
        title: 'Metode Pembayaran',
        href: paymentMethods.index(),
        icon: BadgeDollarSign,
    },
]

const financeNavItems: NavItem[] = [
    {
        title: 'Kas',
        href: cash.index(),
        icon: Banknote
    },
    {
        title: 'Modal',
        href: modals.index(),
        icon: ChartCandlestick
    },
    {
        title: 'Patungan Partner',
        href: '/split-bills',
        icon: Split
    },
]

const purchaseNavItems: NavItem[] = [
    {
        title: 'Belanja Bahan (PO)',
        href: purchases.index(),
        icon: ShoppingCart
    },
]

const productionNavItems: NavItem[] = [
    {
        title: 'Produksi Gabin',
        href: productions.index(),
        icon: CookingPot
    },
    {
        title: 'Hitung Ulang Stok',
        href: stockCorrections.index(),
        icon: SearchCheck
    },
]

const reportNavItems: NavItem[] = [
    {
        title: 'Cuan / Boncos',
        href: reports.incomeStatement(),
        icon: BookOpenText,
    },
    {
        title: 'Uang Masuk-Keluar',
        href: reports.cashFlow(),
        icon: ArrowDownUp,
    },
    {
        title: 'Kesehatan Dompet',
        href: reports.balanceSheet(),
        icon: Scale,
    },
]

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const { isMobile, setOpenMobile } = useSidebar();
    const userRole = auth?.user?.role;
    const isOwner = userRole === 'owner';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch onClick={() => isMobile && setOpenMobile(false)}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} group='Ruang Utama' />
                {userRole === 'admin' && (
                    <NavMain
                        items={[
                            {
                                title: 'Tim Gabin',
                                href: users.index(),
                                icon: Users,
                            }
                        ]}
                        group='Bos Besar'
                    />
                )}
                <NavMain items={masterDataNavItems} group='Data Dapur' />
                <NavMain items={salesNavItems} group='Jual-Jualan' />
                <NavMain items={financeNavItems} group='Duit & Dompet' />
                <NavMain items={purchaseNavItems} group='Belanja' />
                <NavMain items={productionNavItems} group='Bikin Gabin' />
                <NavMain items={reportNavItems} group='Laporan Cuan' />
            </SidebarContent>

            <SidebarFooter>
                <div className="mx-2 mb-2 hidden rounded-2xl bg-sidebar-accent/70 p-3 text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    <p className="font-display text-sm font-extrabold">
                        Gabin renyah, buku rapi.
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium opacity-70">
                        Es krim lumer? Catat dulu. 🍦
                    </p>
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
