import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, CalendarDays, BookUser, Split, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import * as preOrders from '@/actions/App/Http/Controllers/PreOrderController';
import * as customers from '@/actions/App/Http/Controllers/PelangganController';

export function MobileBottomNav() {
    const { url } = usePage();
    const { openMobile, setOpenMobile } = useSidebar();

    const isCurrent = (path: string) => {
        if (path === '/dashboard') {
            return url === '/dashboard' || url === '/';
        }
        return url.startsWith(path);
    };

    const navItems = [
        {
            title: 'Beranda',
            href: dashboard(),
            icon: LayoutGrid,
            active: isCurrent('/dashboard'),
        },
        {
            title: 'Pre-Order',
            href: preOrders.index(),
            icon: CalendarDays,
            active: isCurrent('/pre-orders'),
        },
        {
            title: 'Pelanggan',
            href: customers.index(),
            icon: BookUser,
            active: isCurrent('/pelanggan') || isCurrent('/penjualan'),
        },
        {
            title: 'Patungan',
            href: '/split-bills',
            icon: Split,
            active: isCurrent('/split-bills'),
        },
    ];

    return (
        <nav
            aria-label="Navigasi Bawah Smartphone"
            className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-card/95 backdrop-blur-xl border-t border-border/80 shadow-[0_-8px_24px_rgba(59,36,24,0.08)] pb-safe transition-transform duration-300 print:hidden"
        >
            <div className="flex h-16 items-center justify-around px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            className={cn(
                                'relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 touch-manipulation',
                                item.active
                                    ? 'text-primary font-bold'
                                    : 'text-muted-foreground hover:text-foreground font-medium'
                            )}
                        >
                            <div
                                className={cn(
                                    'flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200',
                                    item.active
                                        ? 'bg-primary/15 text-primary scale-110 shadow-xs ring-1 ring-primary/20'
                                        : 'hover:bg-muted/40'
                                )}
                            >
                                <Icon className="h-5 w-5" strokeWidth={item.active ? 2.5 : 2} />
                            </div>
                            <span className="mt-0.5 text-[10px] tracking-tight truncate max-w-[64px]">
                                {item.title}
                            </span>
                            {item.active && (
                                <span className="absolute -top-1 h-1 w-5 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}

                {/* Tombol Menu Dapur Lengkap (Buka Sidebar Drawer di HP) */}
                <button
                    type="button"
                    onClick={() => setOpenMobile(!openMobile)}
                    aria-label="Buka Menu Lengkap Dapur"
                    aria-expanded={openMobile}
                    className={cn(
                        'relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 touch-manipulation',
                        openMobile
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground hover:text-foreground font-medium'
                    )}
                >
                    <div
                        className={cn(
                            'flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200',
                            openMobile
                                ? 'bg-primary/15 text-primary scale-110 shadow-xs ring-1 ring-primary/20'
                                : 'hover:bg-muted/40'
                        )}
                    >
                        <Menu className="h-5 w-5" strokeWidth={openMobile ? 2.5 : 2} />
                    </div>
                    <span className="mt-0.5 text-[10px] tracking-tight">
                        Dapur
                    </span>
                    {openMobile && (
                        <span className="absolute -top-1 h-1 w-5 rounded-full bg-primary" />
                    )}
                </button>
            </div>
        </nav>
    );
}
