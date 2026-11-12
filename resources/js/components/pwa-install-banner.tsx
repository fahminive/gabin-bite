import { useState } from 'react';
import { X, Download, Share } from 'lucide-react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';

/**
 * Banner "Install GabinBite" - hanya tampil di mobile, bukan standalone,
 * dan belum pernah di-dismiss (tersimpan di localStorage).
 * Android/Chrome: memicu dialog install native via beforeinstallprompt.
 * iOS Safari: hint manual Share - Add to Home Screen.
 */
export function PwaInstallBanner() {
    const { canInstall, isStandalone, isIOS, isDismissed, promptInstall, dismiss } = usePwaInstall();
    const [showIOSHint, setShowIOSHint] = useState(false);

    if (isStandalone || isDismissed) {
        return null;
    }

    // Android: tampil begitu event beforeinstallprompt tersedia.
    if (canInstall) {
        return (
            <div className="md:hidden fixed top-14 left-2 right-2 z-40 flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-lg backdrop-blur-xl">
                <img
                    src="/icons/icon-192.png"
                    alt=""
                    aria-hidden="true"
                    className="h-10 w-10 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-tight">Install GabinBite</p>
                    <p className="text-[11px] leading-tight text-muted-foreground">
                        Akses lebih cepat dari home screen
                    </p>
                </div>
                <Button
                    size="sm"
                    className="h-8 shrink-0 rounded-full px-3 text-xs font-bold"
                    onClick={promptInstall}
                >
                    <Download className="mr-1 h-3.5 w-3.5" />
                    Install
                </Button>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Tutup banner install"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-muted/60"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    // iOS Safari: hint ringan di bawah header, bisa diperluas.
    if (isIOS) {
        return (
            <div className="md:hidden fixed top-14 left-2 right-2 z-40 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-lg backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                    <img
                        src="/icons/icon-192.png"
                        alt=""
                        aria-hidden="true"
                        className="h-10 w-10 shrink-0 rounded-xl"
                    />
                    <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => setShowIOSHint((v) => !v)}
                        aria-expanded={showIOSHint}
                    >
                        <p className="text-sm font-bold leading-tight">Install GabinBite</p>
                        <p className="text-[11px] leading-tight text-muted-foreground">
                            Tap untuk lihat caranya
                        </p>
                    </button>
                    <button
                        type="button"
                        onClick={dismiss}
                        aria-label="Tutup banner install"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-muted/60"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {showIOSHint && (
                    <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                        <Share className="h-3.5 w-3.5 shrink-0" />
                        Di Safari: tekan <strong className="mx-0.5">Share</strong> lalu pilih
                        <strong className="mx-0.5">Add to Home Screen</strong>
                    </p>
                )}
            </div>
        );
    }

    return null;
}
