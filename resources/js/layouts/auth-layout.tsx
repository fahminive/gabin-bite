import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { usePwa } from '@/hooks/use-pwa';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    usePwa();

    return (
        <AuthLayoutTemplate title={title} description={description}>
            {children}
        </AuthLayoutTemplate>
    );
}
