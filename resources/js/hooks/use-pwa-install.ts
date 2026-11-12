import { useCallback, useEffect, useState } from 'react';

const DISMISS_KEY = 'gabinbite.pwa.dismissed';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA install prompt + status kesiapan install.
 * Android/Chrome: memakai event `beforeinstallprompt`.
 * iOS Safari: tidak punya event tersebut, tampilkan hint manual.
 */
export function usePwaInstall() {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isDismissed, setIsDismissed] = useState(true);

    useEffect(() => {
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone === true;
        setIsStandalone(standalone);
        setIsDismissed(localStorage.getItem(DISMISS_KEY) === '1');

        const onBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    }, []);

    const promptInstall = useCallback(async () => {
        if (!installPrompt) {
            return;
        }
        await installPrompt.prompt();
        setInstallPrompt(null);
    }, [installPrompt]);

    const dismiss = useCallback(() => {
        localStorage.setItem(DISMISS_KEY, '1');
        setIsDismissed(true);
        setInstallPrompt(null);
    }, []);

    return {
        /** Android/Chrome: event install tersedia. */
        canInstall: installPrompt !== null,
        /** Sudah berjalan sebagai app ter-install. */
        isStandalone,
        /** iOS Safari: butuh hint manual "Share - Add to Home Screen". */
        isIOS: typeof window !== 'undefined' && /iphone|ipad|ipod/i.test(window.navigator.userAgent),
        isDismissed,
        promptInstall,
        dismiss,
    };
}
