import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import GabinMascot from '@/components/gabin-mascot';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import { Sparkles } from 'lucide-react';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4 py-10 md:p-8">
            <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute top-1/3 -right-28 h-80 w-80 rounded-full bg-accent/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-secondary/40 blur-3xl" />

            <div className="relative w-full max-w-md">
                <div className="gabin-float absolute -top-14 -right-3 z-10 hidden h-28 w-28 rotate-6 sm:block">
                    <GabinMascot className="h-full w-full" sparkles={false} />
                </div>

                <div className="relative rounded-[2.25rem] border-4 border-foreground/10 bg-card p-6 shadow-[0_14px_0_-6px_var(--border)] sm:p-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <Link
                            href={home()}
                            className="group flex items-center gap-2.5"
                        >
                            <AppLogoIcon className="h-12 w-12 -rotate-3 drop-shadow-sm transition-transform duration-300 group-hover:rotate-0" />
                            <span className="font-display text-2xl font-extrabold tracking-tight">
                                gabinbite
                                <span className="text-primary">.pwt</span>
                            </span>
                        </Link>

                        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[10px] font-extrabold tracking-[0.12em] text-accent-foreground uppercase">
                            <Sparkles className="h-3 w-3" />
                            dapur digital anti boncos
                        </div>

                        <div className="space-y-1.5">
                            <h1 className="font-display text-2xl font-extrabold tracking-tight">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-sm font-medium text-balance text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-7">{children}</div>

                    <p className="mt-7 text-center text-[11px] font-semibold text-muted-foreground">
                        Gabin renyah, buku rapi. Es krim lumer? Tetap tercatat. 🍦
                    </p>
                </div>
            </div>
        </div>
    );
}
