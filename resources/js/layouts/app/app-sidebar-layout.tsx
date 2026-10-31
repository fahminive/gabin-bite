import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden pb-20 md:pb-0 min-h-screen">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex-1 w-full">
                    {children}
                </div>
            </AppContent>
            <MobileBottomNav />
        </AppShell>
    );
}
