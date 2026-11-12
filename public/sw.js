/*
 * GabinBite Service Worker
 * ------------------------
 * Strategi cache:
 *   - HTML / navigasi Inertia (X-Inertia)  : NETWORK ONLY utk data Inertia
 *     (respons X-Inertia adalah JSON sesi user, tidak boleh dicache).
 *     Halaman HTML biasa = network-first, fallback offline.html.
 *   - Aset statis (build Vite, ikon, font) : stale-while-revalidate.
 *   - POST / request ber-kredensial selain same-origin: TIDAK dicache.
 *
 * Naikkan CACHE_VERSION setiap deploy yang mengubah aset publik
 * (lihat MOBILE_PWA_NOTES.md).
 */
const CACHE_VERSION = 'gabinbite-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
    OFFLINE_URL,
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/maskable-512.png',
    '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_VERSION)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE_VERSION)
                        .map((key) => caches.delete(key)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Hanya GET same-origin. POST/PUT/DELETE (CSRF, login, dll) tidak disentuh.
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
        return;
    }

    // Request navigasi (HTML): network-first, fallback offline.html.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Jangan cache halaman HTML ber-kredensial (session user).
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(request).then(
                        (cached) =>
                            cached ||
                            caches.match(OFFLINE_URL).then(
                                (offline) =>
                                    offline ||
                                    new Response('Offline', {
                                        status: 503,
                                        headers: { 'Content-Type': 'text/plain' },
                                    }),
                            ),
                    ),
                ),
        );
        return;
    }

    // Respons Inertia (partial reload JSON): selalu network, jangan dicache.
    if (request.headers.get('X-Inertia') || request.headers.get('accept') === 'text/html, xhtml') {
        return;
    }

    // Aset statis: stale-while-revalidate.
    const isStaticAsset =
        /\.(?:css|js|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf)$/.test(new URL(request.url).pathname) ||
        new URL(request.url).pathname.startsWith('/build/');

    if (isStaticAsset) {
        event.respondWith(
            caches.match(request).then((cached) => {
                const network = fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            const copy = response.clone();
                            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
                        }
                        return response;
                    })
                    .catch(() => cached);
                return cached || network;
            }),
        );
    }
});
