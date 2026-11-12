/**
 * Utilitas geo untuk fitur Rute Pengantaran.
 * Geocoding: Nominatim (gratis, 1 req/detik) - estimasi titik dari alamat teks.
 * Rute optimal: OSRM public server (trip service = TSP solver).
 */

export interface LatLng {
    lat: number;
    lng: number;
}

/**
 * Estimasi titik dari alamat teks via Nominatim.
 * Return null bila tidak ketemu / rate-limit / gagal jaringan.
 * `countrycodes=id` membatasi ke Indonesia supaya hasil lebih relevan.
 */
export async function geocodeAlamat(alamat: string): Promise<LatLng | null> {
    const url =
        'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&q=' +
        encodeURIComponent(alamat);

    try {
        const res = await fetch(url, {
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
            return null;
        }
        const data = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (!data.length) {
            return null;
        }
        return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
    } catch {
        return null;
    }
}

export interface OsrmTripResult {
    /** Urutan index stop (0-based sesuai array koordinat yang dikirim) */
    urutan: number[];
    /** [lat, lng][] geometri garis rute utk polyline */
    geometri: Array<[number, number]>;
    /** Meter */
    jarak: number;
    /** Detik */
    durasi: number;
}

/**
 * Rute optimal one-way: dapur -> semua titik (berhenti di titik terakhir).
 * OSRM /trip dengan source=first (dapur selalu titik pertama di `koordinat`).
 */
export async function osrmTripOneWay(koordinat: LatLng[]): Promise<OsrmTripResult | null> {
    return osrmTrip(koordinat, false);
}

/**
 * Rute optimal round-trip: dapur -> semua titik -> pulang ke dapur.
 */
export async function osrmTripRoundTrip(koordinat: LatLng[]): Promise<OsrmTripResult | null> {
    return osrmTrip(koordinat, true);
}

async function osrmTrip(koordinat: LatLng[], roundtrip: boolean): Promise<OsrmTripResult | null> {
    if (koordinat.length < 2) {
        return null;
    }

    const coordStr = koordinat.map((c) => `${c.lng},${c.lat}`).join(';');
    const url =
        `https://router.project-osrm.org/trip/v1/driving/${coordStr}` +
        `?source=first&roundtrip=${roundtrip ? 'true' : 'false'}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            return null;
        }
        const data = (await res.json()) as {
            code: string;
            trips: Array<{
                legs: Array<{ distance: number; duration: number }>;
                geometry: { coordinates: Array<[number, number]> };
            }> | null;
            waypoints: Array<{ waypoint_index: number }>;
        };

        if (data.code !== 'Ok' || !data.trips?.length) {
            return null;
        }

        const trip = data.trips[0];
        return {
            // Urutan kunjungan: posisi koordinat input setelah dioptimasi
            // (waypoints[i].waypoint_index = index di array trips geometry,
            // tapi urutan kunjungan = index i sendiri; koordinat optimal
            // didapat dari urutan waypoints terhadap input).
            urutan: (data.waypoints ?? []).map((w) => w.waypoint_index),
            geometri: trip.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
            jarak: trip.legs.reduce((sum, leg) => sum + leg.distance, 0),
            durasi: trip.legs.reduce((sum, leg) => sum + leg.duration, 0),
        };
    } catch {
        return null;
    }
}

export interface OsrmRouteResult {
    geometri: Array<[number, number]>;
    jarak: number;
    durasi: number;
}

/**
 * Rute tetap-urutan (bukan optimasi): dapur -> titik1 -> titik2 ... -> dapur.
 * Dipakai setelah user puas dengan urutan / fallback bila trip gagal.
 */
export async function osrmRouteFixed(koordinat: LatLng[]): Promise<OsrmRouteResult | null> {
    if (koordinat.length < 2) {
        return null;
    }

    const coordStr = koordinat.map((c) => `${c.lng},${c.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            return null;
        }
        const data = (await res.json()) as {
            code: string;
            routes: Array<{
                distance: number;
                duration: number;
                geometry: { coordinates: Array<[number, number]> };
            }>;
        };

        if (data.code !== 'Ok' || !data.routes?.length) {
            return null;
        }

        const route = data.routes[0];
        return {
            geometri: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
            jarak: route.distance,
            durasi: route.duration,
        };
    } catch {
        return null;
    }
}

export const formatJarak = (meter: number) =>
    meter >= 1000 ? `${(meter / 1000).toFixed(1)} km` : `${Math.round(meter)} m`;

export const formatDurasi = (detik: number) => {
    const menit = Math.round(detik / 60);
    if (menit < 60) {
        return `${menit} menit`;
    }
    return `${Math.floor(menit / 60)} jam ${menit % 60} mnt`;
};

/** Link navigasi Google Maps ke satu titik saja. */
export const gmapsPerTitik = (lat: number, lng: number) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
