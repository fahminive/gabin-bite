import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex min-w-0 items-center gap-2.5">
            <AppLogoIcon className="h-10 w-10 shrink-0 -rotate-3 drop-shadow-sm transition-transform duration-300 group-hover:rotate-0" />
            <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-display text-lg font-extrabold tracking-tight">
                    gabinbite<span className="text-primary">.pwt</span>
                </span>
                <span className="truncate text-[10px] font-bold tracking-[0.14em] uppercase opacity-50">
                    dapur rapi, gabin happy
                </span>
            </div>
        </div>
    );
}
