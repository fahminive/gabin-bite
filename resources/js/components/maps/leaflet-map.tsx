import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
    /** [lat, lng][] - marker urut nomor 1..n */
    markers: Array<{ lat: number; lng: number; label: string; nomor?: number }>;
    /** Titik dapur: marker khusus ikon rumah */
    dapur?: { lat: number; lng: number; nama?: string } | null;
    /** [lat, lng][] urutan rute hasil optimasi - digambar polyline */
    polyline?: Array<[number, number]>;
    /** Posisi GPS kurir saat ini (titik biru + lingkaran akurasi) */
    titikSaya?: { lat: number; lng: number; akurasi?: number } | null;
    /** Klik peta (untuk pin titik manual / set dapur) */
    onMapClick?: (lat: number, lng: number) => void;
    className?: string;
}

const ikonDapur = () =>
    L.divIcon({
        html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;background:#23150f;color:#fff3e0;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff3e0">&#127968;</div>',
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });

const ikonNomor = (nomor: number) =>
    L.divIcon({
        html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:#E94F87;color:#fff;font-weight:700;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff">${nomor}</div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });

const ikonSaya = () =>
    L.divIcon({
        html: '<div style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:999px;background:#1d4ed8;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.45)"></div>',
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });

/**
 * Peta Leaflet (OpenStreetMap) tanpa API key.
 *
 * Peta DIBUAT SEKALI saja (tanpa destroy/recreate saat data berubah) -
 * marker & polyline diupdate lewat LayerGroup. Ini menghindari error
 * "Map container is already initialized" yang membuat layar putih, dan
 * sekaligus menghindari reload tile setiap kali state berubah.
 */
export function LeafletMap({
    markers,
    dapur,
    polyline,
    titikSaya,
    onMapClick,
    className = 'h-[420px] w-full',
}: LeafletMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerGroupRef = useRef<L.LayerGroup | null>(null);
    const polylineLayerRef = useRef<L.Polyline | null>(null);
    const sayaMarkerRef = useRef<L.Marker | null>(null);
    const sayaAkurasiRef = useRef<L.Circle | null>(null);
    const sayaCenteredRef = useRef(false);
    const fittedRef = useRef(false);

    // Callback terbaru di ref: click listener tetap memanggil versi terbaru
    // walau mode titik manual/set dapur berubah tanpa peta re-init.
    const onMapClickRef = useRef(onMapClick);
    useEffect(() => {
        onMapClickRef.current = onMapClick;
    }, [onMapClick]);

    // ===== Buat peta SEKALI =====
    useEffect(() => {
        if (!containerRef.current || mapRef.current) {
            return;
        }

        const map = L.map(containerRef.current).setView([-6.2, 106.816], 11);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        layerGroupRef.current = L.layerGroup().addTo(map);

        map.on('click', (e: L.LeafletMouseEvent) => {
            onMapClickRef.current?.(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            layerGroupRef.current = null;
            polylineLayerRef.current = null;
            sayaMarkerRef.current = null;
            sayaAkurasiRef.current = null;
            fittedRef.current = false;
        };
    }, []);

    // ===== Update marker GPS kurir (realtime, TIDAK mengganggu view) =====
    const sayaKey = titikSaya ? `${titikSaya.lat},${titikSaya.lng}` : '';
    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        if (!titikSaya) {
            sayaMarkerRef.current?.remove();
            sayaAkurasiRef.current?.remove();
            sayaMarkerRef.current = null;
            sayaAkurasiRef.current = null;
            sayaCenteredRef.current = false;
            return;
        }

        if (!sayaMarkerRef.current) {
            sayaMarkerRef.current = L.marker([titikSaya.lat, titikSaya.lng], {
                icon: ikonSaya(),
                zIndexOffset: 1000,
                interactive: false,
            }).addTo(map);
        } else {
            sayaMarkerRef.current.setLatLng([titikSaya.lat, titikSaya.lng]);
        }

        if (titikSaya.akurasi && titikSaya.akurasi > 0) {
            if (!sayaAkurasiRef.current) {
                sayaAkurasiRef.current = L.circle([titikSaya.lat, titikSaya.lng], {
                    radius: titikSaya.akurasi,
                    color: '#1d4ed8',
                    weight: 1,
                    fillColor: '#1d4ed8',
                    fillOpacity: 0.08,
                    interactive: false,
                }).addTo(map);
            } else {
                sayaAkurasiRef.current.setLatLng([titikSaya.lat, titikSaya.lng]);
                sayaAkurasiRef.current.setRadius(titikSaya.akurasi);
            }
        }

        // Center sekali di awal supaya user melihat dirinya, lalu TIDAK
        // dipaksa lagi (user bebas geser-zoom utk cek rute).
        if (!sayaCenteredRef.current) {
            map.setView([titikSaya.lat, titikSaya.lng], 16);
            sayaCenteredRef.current = true;
        }
    }, [sayaKey]);

    // ===== Update markers + polyline + fit bounds =====
    const markersKey = JSON.stringify(markers);
    const dapurKey = dapur ? `${dapur.lat},${dapur.lng}` : '';
    const polylineKey = JSON.stringify(polyline ?? []);

    useEffect(() => {
        const map = mapRef.current;
        const layerGroup = layerGroupRef.current;
        if (!map || !layerGroup) {
            return;
        }

        layerGroup.clearLayers();

        if (dapur) {
            L.marker([dapur.lat, dapur.lng], { icon: ikonDapur() })
                .addTo(layerGroup)
                .bindTooltip(dapur.nama ?? 'Dapur');
        }

        markers.forEach((m, index) => {
            const nomor = m.nomor ?? index + 1;
            L.marker([m.lat, m.lng], { icon: ikonNomor(nomor) })
                .addTo(layerGroup)
                .bindTooltip(`${nomor}. ${m.label}`);
        });

        if (polylineLayerRef.current) {
            polylineLayerRef.current.remove();
            polylineLayerRef.current = null;
        }
        if (polyline && polyline.length > 1) {
            polylineLayerRef.current = L.polyline(polyline, {
                color: '#23150f',
                weight: 4,
                opacity: 0.75,
                dashArray: '8 6',
            }).addTo(map);
        }

        // Fit bounds ke semua titik (sekali per perubahan data)
        const all: Array<[number, number]> = [
            ...markers.map((m) => [m.lat, m.lng] as [number, number]),
            ...(dapur ? ([[dapur.lat, dapur.lng]] as Array<[number, number]>) : []),
        ];
        if (all.length === 1) {
            map.setView(all[0], 15);
            fittedRef.current = true;
        } else if (all.length > 1) {
            map.fitBounds(L.latLngBounds(all).pad(0.15));
            fittedRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [markersKey, dapurKey, polylineKey]);

    return <div ref={containerRef} className={className} />;
}
