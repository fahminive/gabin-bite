import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
    /** [lat, lng][] - marker urut nomor 1..n */
    markers: Array<{ lat: number; lng: number; label: string; nomor?: number }>;
    /** Titik dapur: marker khusus + garis mulai dari sini */
    dapur?: { lat: number; lng: number; nama?: string } | null;
    /** [lat, lng][] urutan rute hasil optimasi - digambar polyline */
    polyline?: Array<[number, number]>;
    /** Klik peta (untuk pin titik manual / set dapur) */
    onMapClick?: (lat: number, lng: number) => void;
    className?: string;
}

/**
 * Peta Leaflet (OpenStreetMap) tanpa API key.
 * Render imperatif supaya mudah sinkron dengan state rute di parent.
 */
export function LeafletMap({
    markers,
    dapur,
    polyline,
    onMapClick,
    className = 'h-[420px] w-full',
}: LeafletMapProps) {
    useEffect(() => {
        const container = document.getElementById('gabin-route-map');
        if (!container) {
            return;
        }

        // Bersihkan map lama saat re-render (HMR/re-visit)
        const withMap = container as unknown as { _leaflet_map?: L.Map };
        if (withMap._leaflet_map) {
            withMap._leaflet_map.remove();
        }

        const map = L.map(container).setView(
            dapur ? [dapur.lat, dapur.lng] : [-6.2, 106.816],
            dapur ? 13 : 11,
        );
        withMap._leaflet_map = map;

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        if (onMapClick) {
            map.on('click', (e: L.LeafletMouseEvent) => {
                onMapClick(e.latlng.lat, e.latlng.lng);
            });
        }

        // Marker dapur (rumah) = ikon rumah warna coklat brand
        if (dapur) {
            L.marker([dapur.lat, dapur.lng], {
                icon: L.divIcon({
                    html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;background:#23150f;color:#fff3e0;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff3e0">&#127968;</div>',
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                }),
            })
                .addTo(map)
                .bindTooltip(dapur.nama ?? 'Dapur', { permanent: false });
        }

        // Marker pembeli: bernomor urutan rute
        markers.forEach((m, index) => {
            const nomor = m.nomor ?? index + 1;
            L.marker([m.lat, m.lng], {
                icon: L.divIcon({
                    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:#E94F87;color:#fff;font-weight:700;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff">${nomor}</div>`,
                    className: '',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                }),
            })
                .addTo(map)
                .bindTooltip(`${nomor}. ${m.label}`, { permanent: false });
        });

        // Garis rute hasil optimasi
        if (polyline && polyline.length > 1) {
            L.polyline(polyline, {
                color: '#23150f',
                weight: 4,
                opacity: 0.75,
                dashArray: '8 6',
            }).addTo(map);
        }

        // Fit bounds ke semua titik
        const all: Array<[number, number]> = [
            ...markers.map((m) => [m.lat, m.lng] as [number, number]),
            ...(dapur ? [[dapur.lat, dapur.lng] as [number, number]] : []),
        ];
        if (all.length > 1) {
            map.fitBounds(L.latLngBounds(all).pad(0.15));
        } else if (all.length === 1) {
            map.setView(all[0], 15);
        }

        return () => {
            map.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(markers), dapur?.lat, dapur?.lng, JSON.stringify(polyline)]);

    return <div id="gabin-route-map" className={className} />;
}
