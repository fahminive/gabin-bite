import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function formatRupiah(value: number | string): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(value));
}

export function formatRupiahCompact(value: number | string): string {
    const num = Number(value);
    if (num >= 1000000000) return `Rp ${(num / 1000000000).toFixed(1)}M`;
    if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}Jt`;
    if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}K`;
    if (num <= -1000000000) return `-Rp ${Math.abs(num / 1000000000).toFixed(1)}M`;
    if (num <= -1000000) return `-Rp ${Math.abs(num / 1000000).toFixed(1)}Jt`;
    if (num <= -1000) return `-Rp ${Math.abs(num / 1000).toFixed(0)}K`;
    return `Rp ${num}`;
}
