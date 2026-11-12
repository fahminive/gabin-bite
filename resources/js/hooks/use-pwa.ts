import { useEffect } from 'react';

const SW_URL = '/sw.js';

/** Registrasi service worker - dipanggil sekali global dari app.tsx. */
export function registerServiceWorker(): void {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(SW_URL).catch((error) => {
                console.warn('[PWA] Service worker registration failed:', error);
            });
        });
    }
}

/**
 * Meta tags PWA + registrasi service worker.
 * Dikelola di satu hook supaya layout guest dan auth memakai satu sumber
 * yang sama tanpa duplikasi tag.
 */
export function usePwa() {
    useEffect(() => {
        const head = document.head;

        const ensureMeta = (attr: 'name' | 'property', key: string, content: string) => {
            let tag = head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
            if (tag) {
                tag.setAttribute('content', content);
                return;
            }
            tag = document.createElement('meta');
            tag.setAttribute(attr, key);
            tag.setAttribute('content', content);
            head.appendChild(tag);
        };

        const ensureLink = (rel: string, href: string, extra: Record<string, string> = {}) => {
            let tag = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
            if (!tag) {
                tag = document.createElement('link');
                tag.rel = rel;
                head.appendChild(tag);
            }
            tag.href = href;
            Object.entries(extra).forEach(([k, v]) => tag.setAttribute(k, v));
        };

        // Manifest + ikon + status bar. theme-color TIDAK dioverride bila
        // blade sudah menyetelnya dengan media query light/dark.
        ensureLink('manifest', '/manifest.webmanifest');
        ensureLink('apple-touch-icon', '/icons/apple-touch-icon.png', { sizes: '180x180' });
        if (!head.querySelector('meta[name="theme-color"]')) {
            ensureMeta('name', 'theme-color', '#23150f');
        }
        ensureMeta('name', 'apple-mobile-web-app-capable', 'yes');
        ensureMeta('name', 'mobile-web-app-capable', 'yes');
        ensureMeta('name', 'apple-mobile-web-app-status-bar-style', 'black-translucent');
        ensureMeta('name', 'apple-mobile-web-app-title', 'GabinBite');

        // viewport-fit=cover untuk notch/safe-area (merge, jangan duplikasi)
        const viewport = head.querySelector<HTMLMetaElement>('meta[name="viewport"]');
        if (viewport) {
            if (!viewport.content.includes('viewport-fit=cover')) {
                viewport.content += ', viewport-fit=cover';
            }
        } else {
            ensureMeta('name', 'viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
        }

        // Registrasi service worker sudah global di app.tsx
        // (registerServiceWorker), supaya jalan di semua halaman.
    }, []);

    // Class `standalone` di <html> untuk styling khusus mode app ter-install
    useEffect(() => {
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone === true;
        document.documentElement.classList.toggle('standalone', standalone);
    }, []);
}
