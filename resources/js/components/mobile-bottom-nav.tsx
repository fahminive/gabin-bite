import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, ClipboardList, CookingPot, UserRound, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import * as sales from '@/actions/App/Http/Controllers/PenjualanController';
import * as productions from '@/actions/App/Http/Controllers/ProduksiController';
import { edit } from '@/routes/profile';
import { MobileMenuSheet } from '@/components/mobile-menu-sheet';

export function MobileBottomNav() {
    const { url } = usePage();

    const isCurrent = (path: string) => {
        if (path === '/dashboard') {
            return url === '/dashboard' || url === '/';
        }
        if (path === '/settings') {
            return url.startsWith('/settings');
        }
        return url.startsWith(path);
    };

    const navKiri = [
        {
            title: 'Beranda',
            href: dashboard(),
            icon: LayoutDashboard,
            active: isCurrent('/dashboard'),
        },
        {
            title: 'PO Penjualan',
            href: sales.index().url,
            icon: ClipboardList,
            active: isCurrent('/sales'),
        },
    ];

    const navKanan = [
        {
            title: 'Produksi',
            href: productions.index().url,
            icon: CookingPot,
            active: isCurrent('/productions'),
        },
        {
            title: 'Profil',
            href: edit(),
            icon: UserRound,
            active: isCurrent('/settings'),
        },
    ];

    return (
        <nav
            aria-label="Navigasi Bawah Smartphone"
            className="fixed bottom-0 left-0 right-0 z-40 block md:hidden print:hidden"
        >
            {/* Cekungan kiri-kanan ala BNB-45: dua pill mengapit tombol tengah */}
            <div className="relative mx-3 mb-3 flex items-end justify-between">
                {/* Kiri: 2 menu */}
                <div className="flex flex-1 items-start justify-around rounded-3xl border border-white/40 bg-white/50 shadow-lg shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/50">
                    {navKiri.map((item) => (
                        <NavItem key={item.title} item={item} />
                    ))}
                    {/* Slot kosong agar simetris dgn kanan (2 kolom per sisi) */}
                    <span className="w-[68px]" aria-hidden />
                </div>

                {/* Tengah: tombol menu menonjol */}
                <div className="relative z-10 -mx-6 flex w-18 shrink-0 justify-center">
                    <div className="absolute -top-7 h-16 w-16 rounded-full border border-white/40 bg-white/50 shadow-lg shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/50" />
                    <div className="absolute -top-7 flex h-16 w-16 items-center justify-center">
                        <MobileMenuSheet />
                    </div>
                </div>

                {/* Kanan: 2 menu */}
                <div className="flex flex-1 items-start justify-around rounded-3xl border border-white/40 bg-white/50 shadow-lg shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/50">
                    <span className="w-[68px]" aria-hidden />
                    {navKanan.map((item) => (
                        <NavItem key={item.title} item={item} />
                    ))}
                </div>
            </div>
        </nav>
    );
}

function NavItem({
    item,
}: {
    item: {
        title: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href: any;
        icon: typeof LayoutDashboard;
        active: boolean;
    };
}) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            prefetch
            className={cn(
                'relative flex w-[68px] flex-col items-center gap-0.5 py-2.5 transition-all duration-200 active:scale-95 touch-manipulation',
                item.active
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground font-medium',
            )}
        >
            <Icon className="h-5 w-5" strokeWidth={item.active ? 2.5 : 2} />
            <span className="text-[10px] leading-none tracking-tight">{item.title}</span>
            {item.active && <span className="absolute top-1.5 h-0.5 w-4 rounded-full bg-primary" />}
        </Link>
    );
}
