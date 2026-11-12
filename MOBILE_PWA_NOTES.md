# Mobile UI & PWA Notes

Dokumentasi implementasi mobile-first UI (breakpoint `< 768px`) dan PWA (installable) untuk GabinBite.

## Struktur File

### PWA
| File | Fungsi |
|---|---|
| `public/manifest.webmanifest` | Manifest: nama, ikon, warna tema `#23150f`, standalone, portrait |
| `public/sw.js` | Service worker: strategi cache + fallback offline |
| `public/offline.html` | Halaman fallback saat offline |
| `public/icons/` | `icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png` (180) |
| `resources/js/hooks/use-pwa.ts` | Head tags (merge, tanpa duplikasi) + `registerServiceWorker()` global |
| `resources/js/hooks/use-pwa-install.ts` | Hook install prompt (`beforeinstallprompt` + deteksi iOS) |
| `resources/js/components/pwa-install-banner.tsx` | Banner "Install GabinBite" dismissible |
| `resources/js/components/pwa-head-tags.tsx` | Head tags untuk halaman tanpa layout (welcome) |
| `app/Http/Middleware/PwaHeaders.php` | Header `Content-Type` manifest, `Service-Worker-Allowed`, no-cache sw.js |

### Mobile UI
| File | Fungsi |
|---|---|
| `resources/css/app.css` | Blok `@media (max-width: 767px)`: font 14px, touch-action, overscroll, safe-area |
| `resources/js/components/data-table.tsx` | Tabel = stacked cards di `<md` (berlaku untuk 12 halaman) |
| `resources/js/components/mobile-bottom-nav.tsx` | Bottom nav 5 item (4 tab + tombol menu) |
| `resources/js/components/app-sidebar-header.tsx` | Top app bar compact mobile |
| `resources/js/components/ui/dialog.tsx` | Dialog = bottom sheet di `<sm` |
| `resources/js/pages/SplitBill/Index.tsx` | Kartu saldo/penyesuaian/transfer per partner |
| `resources/js/pages/Sales/Create.tsx` | Form item jadi kartu di mobile |
| `resources/js/pages/Purchases/Create.tsx` | Form item jadi kartu + sticky action bar |
| `resources/js/pages/Produk/Index.tsx` | Rincian per varian jadi baris ringkas |
| `resources/js/pages/Reports/IncomeStatement.tsx` | Pendapatan & HPP per varian jadi baris ringkas |

## Breakpoints

- `< 768px` (`md:hidden` / `max-md:`): layout mobile penuh - bottom nav, stacked cards, font 14px
- `>= 768px` (`hidden md:block`): layout desktop - tidak ada perubahan sama sekali dari sebelumnya

Breakpoint utama Tailwind `md` (768px). Bottom sheet dialog memakai `sm` (640px).

## Strategi Service Worker

| Konten | Strategi |
|---|---|
| Navigasi HTML | Network-first, fallback `offline.html` saat gagal |
| Respons Inertia (`X-Inertia`) | Selalu network, tidak pernah dicache (data user/session) |
| POST/PUT/DELETE | Tidak disentuh (CSRF & auth aman) |
| Aset statis (`/build/*`, ikon, font) | Stale-while-revalidate |

### Update versi cache
Naikkan konstanta `CACHE_VERSION` di `public/sw.js` setiap mengubah aset publik:

```js
const CACHE_VERSION = 'gabinbite-v1'; // -> 'gabinbite-v2'
```

Cache lama otomatis terhapus pada event `activate`.

## Header Vercel

File PWA diserve Laravel (FrankenPHP). Header diset `PwaHeaders` middleware
(diregister global di `bootstrap/app.php`):

- `manifest.webmanifest` -> `Content-Type: application/manifest+json`
- `sw.js` -> `Cache-Control: no-cache, must-revalidate` + `Service-Worker-Allowed: /`
- `offline.html` -> `Cache-Control: no-cache`

## Cara Test Install

### Android (Chrome)
1. Buka site (HTTPS), tunggu banner "Install GabinBite" muncul, tap **Install**
   (atau menu Chrome - "Add to Home screen")
2. App terbuka standalone tanpa browser UI

### iOS (Safari)
1. Buka site di Safari, tap banner untuk lihat hint
2. Tap tombol **Share** - **Add to Home Screen**

### Verifikasi
- `GET /manifest.webmanifest` -> 200 + `Content-Type: application/manifest+json`
- `GET /sw.js` -> 200 + `Service-Worker-Allowed: /`
- DevTools - Application - Manifest: tidak ada error
- DevTools - Application - Service Workers: activated & running
- Lighthouse - PWA: installable
- Mode offline (DevTools - Network - Offline): reload halaman -> fallback `offline.html`
- Test layout di 360 / 390 / 430px: tidak ada horizontal scroll, desktop tidak berubah

## Aturan Penting

1. **Desktop tidak boleh berubah**: setiap perubahan mobile harus dalam `md:hidden`
   atau `max-md:`/`max-sm:` - jangan pernah mengubah class desktop yang sudah ada
2. **Tidak cache data sensitif**: respons Inertia, POST, dan halaman auth tidak
   pernah masuk cache SW
3. **Safe area**: elemen fixed (bottom nav, sticky bar) wajib `pb-safe`/`env(safe-area-inset-*)`
4. **Touch target minimal 40x40px**, font dasar mobile 14px (judul 16-18, caption 11-12)
5. Tanpa karakter dash di UI
