import { Link, usePage } from '@inertiajs/react';
import { Moon, Sun, ChevronsUpDown, Sparkles } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import AppLogoIcon from '@/components/app-logo-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { MobileMenuSheet } from '@/components/mobile-menu-sheet';
import { useAppearance } from '@/hooks/use-appearance';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem as BreadcrumbItemType, User } from '@/types';
import { dashboard } from '@/routes';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props as { auth?: { user?: User } };
    const user = auth?.user;
    const getInitials = useInitials();
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const currentPageTitle =
        breadcrumbs.length > 0
            ? breadcrumbs[breadcrumbs.length - 1].title
            : 'Dapur Gabin';

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="sticky top-0 z-30 flex h-14 md:h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/90 px-3 md:px-6 backdrop-blur-md transition-all ease-linear print:hidden">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
                <SidebarTrigger className="-ml-1 h-9 w-9 rounded-xl hover:bg-muted/70 transition-colors" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Mobile Header: Menu button (buka sheet semua menu) + App Brand + Active Page Pill */}
            <div className="flex md:hidden items-center gap-2 min-w-0 flex-1">
                <div className="md:hidden">
                    <MobileMenuSheet />
                </div>
                <Link
                    href={dashboard()}
                    prefetch
                    className="flex items-center gap-1.5 shrink-0 focus:outline-hidden"
                >
                    <AppLogoIcon className="h-7 w-7 drop-shadow-xs" />
                </Link>
                <div className="flex items-center min-w-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary truncate max-w-[150px] xs:max-w-[190px]">
                        <Sparkles className="h-3 w-3 shrink-0" />
                        <span className="truncate">{currentPageTitle}</span>
                    </span>
                </div>
            </div>

            {/* Right Side Quick Controls (Theme Toggle & User Profile) */}
            <div className="flex items-center gap-1.5 shrink-0">
                {/* Theme Toggle Button */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Ubah Tema Gelap / Terang"
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                    {resolvedAppearance === 'dark' ? (
                        <Sun className="h-4 w-4 text-amber-400" />
                    ) : (
                        <Moon className="h-4 w-4 text-slate-700" />
                    )}
                </Button>

                {/* User Dropdown Shortcut - selalu tampil di kanan atas */}
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                aria-label="Menu Pengguna"
                                className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-primary/40 focus:outline-hidden transition-all"
                            >
                                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-border">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="text-[11px] font-extrabold bg-primary/10 text-primary">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-56 rounded-2xl shadow-xl border-2 p-1"
                            align="end"
                            sideOffset={6}
                        >
                            <UserMenuContent user={user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
