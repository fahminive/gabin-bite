import { Head } from '@inertiajs/react';

/**
 * Head tags PWA untuk halaman yang tidak memakai AppLayout/AuthLayout
 * (mis. welcome/landing). Layout app & auth memakai hook usePwa();
 * di sini dipakai komponen Head Inertia yang menulis ke document.head.
 */
export function PwaHeadTags() {
    return (
        <Head>
            <link rel="manifest" href="/manifest.webmanifest" />
            <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="GabinBite" />
        </Head>
    );
}
