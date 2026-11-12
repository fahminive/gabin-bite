import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { PwaInstallBanner } from '@/components/pwa-install-banner';
import { usePwa } from '@/hooks/use-pwa';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    usePwa();

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <PwaInstallBanner />
            {children}
        </AppLayoutTemplate>
    );
}
