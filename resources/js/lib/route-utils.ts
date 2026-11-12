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
    /** Index input (TANPA dapur=0) urut kunjungan hasil optimasi OSRM */
    urutanInputKunjungan: number[];
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
        // data.waypoints[i] = titik input ke-i SETELAH dioptimasi;
        // waypoint_index = posisi input aslinya. Jadi urutan kunjungan
        // input = [waypoints[0].waypoint_index, waypoints[1].waypoint_index, ...]
        // (index 0 = dapur). Verifikasi: curl dgn input (dapur, A, B) yg
        // seharusnya dioptimasi jadi (dapur, B, A) -> waypoints = [0, 2, 1].
        const urutanInput = (data.waypoints ?? []).map((w) => w.waypoint_index);

        return {
            urutanInputKunjungan: urutanInput
                .filter((idx) => idx > 0)
                .sort((a, b) => urutanInput.indexOf(a) - urutanInput.indexOf(b))
                .map((idx) => idx - 1),
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

/**
 * Optimasi urutan kunjungan TANPA jaringan (fallback bila OSRM down):
 * nearest-neighbor dari dapur, lalu perbaiki dgn 2-opt.
 * Return urutan index input (0-based dari array stop TANPA dapur).
 */
export function optimasiLokal(
    titikDapur: LatLng,
    stops: LatLng[],
    pulang: boolean,
): number[] {
    const n = stops.length;
    if (n === 0) {
        return [];
    }
    if (n === 1) {
        return [0];
    }

    const jarak = (a: LatLng, b: LatLng) => {
        // Haversine meter (cukup akurat utk radius kota)
        const R = 6371000;
        const dLat = ((b.lat - a.lat) * Math.PI) / 180;
        const dLng = ((b.lng - a.lng) * Math.PI) / 180;
        const sLat =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((a.lat * Math.PI) / 180) *
                Math.cos((b.lat * Math.PI) / 180) *
                Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(sLat));
    };

    // --- Nearest neighbor mulai dari dapur ---
    const sisa = stops.map((_, i) => i);
    const urutan: number[] = [];
    let current = titikDapur;
    while (sisa.length) {
        let best = 0;
        let bestDist = Infinity;
        sisa.forEach((idx, i) => {
            const d = jarak(current, stops[idx]);
            if (d < bestDist) {
                bestDist = d;
                best = i;
            }
        });
        const nextIdx = sisa.splice(best, 1)[0];
        urutan.push(nextIdx);
        current = stops[nextIdx];
    }

    // --- 2-opt: balik segmen bila memperpendek total rute ---
    const total = (seq: number[]) => {
        const all = [titikDapur, ...seq.map((i) => stops[i])];
        if (pulang) {
            all.push(titikDapur);
        }
        let sum = 0;
        for (let i = 0; i < all.length - 1; i++) {
            sum += jarak(all[i], all[i + 1]);
        }
        return sum;
    };

    let bestSeq = urutan;
    let bestTotal = total(bestSeq);
    let improved = true;
    while (improved) {
        improved = false;
        for (let i = 0; i < bestSeq.length - 1; i++) {
            for (let j = i + 1; j < bestSeq.length; j++) {
                const kandidat = [...bestSeq];
                const segmen = kandidat.slice(i, j + 1).reverse();
                kandidat.splice(i, segmen.length, ...segmen);
                const t = total(kandidat);
                if (t < bestTotal - 1) {
                    bestSeq = kandidat;
                    bestTotal = t;
                    improved = true;
                }
            }
        }
    }

    return bestSeq;
}

/** Link navigasi Google Maps ke satu titik saja. */
export const gmapsPerTitik = (lat: number, lng: number) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

/**
 * Deteksi apakah teks alamat berupa link Google Maps (bisa link pendek
 * maps.app.goo.gl, link lengkap, atau @lat,lng di dalamnya).
 */
export const isGmapsLink = (teks: string) =>
    /https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|maps\.google\.com|goo\.gl\/maps)/i.test(
        teks,
    );

/**
 * Resolve titik dari alamat yang bisa berupa:
 * 1. Link gmaps pendek (maps.app.goo.gl/xxx) atau lengkap dgn @lat,lng
 * 2. Alamat teks biasa -> Nominatim
 *
 * Link pendek diikuti redirect-nya di server (fetch redirect: follow;
 * response.url = URL akhir) lalu koordinat diekstrak.
 */
export async function titikDariAlamat(alamat: string): Promise<LatLng | null> {
    const teks = alamat.trim();

    // 1. Koordinat eksplisit di dalam link/teks: @-6.18,106.83 / q=-6.18,106.83 / !3d-6.18!4d106.83
    const koordinat = ekstrakKoordinat(teks);
    if (koordinat) {
        return koordinat;
    }

    // 2. Link (bisa pendek): resolve SERVER-SIDE via Laravel (browser dibatasi
    // CORS bila fetch langsung ke google.com). Backend ikuti redirect &
    // ekstrak koordinat dari URL final/body.
    if (isGmapsLink(teks)) {
        try {
            const csrf =
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch('/delivery-route/resolve-gmaps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({ url: teks }),
            });
            if (res.ok) {
                const data = (await res.json()) as { titik: null | { lat: number; lng: number } };
                if (data.titik) {
                    return { lat: data.titik.lat, lng: data.titik.lng };
                }
            }
        } catch {
            // backend gagal: anggap tidak ketemu
        }
        // Link bukan koordinat (mis. place link) - jangan kirim URL ke Nominatim
        return null;
    }

    // 3. Alamat teks biasa
    return geocodeAlamat(teks);
}

/** Ekstrak koordinat dari teks/link gmaps dgn berbagai pola umum. */
export function ekstrakKoordinat(teks: string): LatLng | null {
    // @lat,lng (mis. @-6.175392,106.827153,15z)
    let m = teks.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) {
        return cekKoordinat(m[1], m[2]);
    }
    // !3dlat!4dlng (3D/4D param di URL panjang)
    m = teks.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (m) {
        return cekKoordinat(m[1], m[2]);
    }
    // q=lat,lng atau q=lat%2Clng atau hl=id&q=...
    m = teks.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) {
        return cekKoordinat(m[1], m[2]);
    }
    // destination=lat,lng / dir/?api=1&destination=...
    m = teks.match(/[?&]destination=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) {
        return cekKoordinat(m[1], m[2]);
    }
    // ll=lat,lng
    m = teks.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) {
        return cekKoordinat(m[1], m[2]);
    }
    // Teks berisi dua angka desimal yang menyerupai koordinat
    m = teks.match(/(-?\d{1,2}\.\d{4,})[,\s]+(-?\d{1,3}\.\d{4,})/);
    if (m) {
        return cekKoordinat(m[1], m[2]);
    }
    return null;
}

function cekKoordinat(lat: string, lng: string): LatLng | null {
    const la = Number(lat);
    const lo = Number(lng);
    if (
        Number.isFinite(la) &&
        Number.isFinite(lo) &&
        Math.abs(la) <= 90 &&
        Math.abs(lo) <= 180 &&
        (la !== 0 || lo !== 0)
    ) {
        return { lat: la, lng: lo };
    }
    return null;
}

/**
 * Titik GPS user saat ini (sekali ambil). Return null bila ditolak /
 * tidak tersedia / timeout.
 */
export function gpsSekarang(timeoutMs = 10000): Promise<LatLng | null> {
    return new Promise((resolve) => {
        if (!('geolocation' in navigator)) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
        );
    });
}

export interface GpsWatcher {
    /** Berhenti memantau. */
    stop: () => void;
    /** Titik terakhir. */
    titik: () => LatLng | null;
}

/**
 * Pantau GPS berkelanjutan (realtime). Panggil `stop()` saat halaman
 * ditutup / tracking dimatikan.
 */
export function gpsWatch(onUpdate: (titik: LatLng, akurasi: number) => void): GpsWatcher | null {
    if (!('geolocation' in navigator)) {
        return null;
    }

    let terakhir: LatLng | null = null;

    const id = navigator.geolocation.watchPosition(
        (pos) => {
            terakhir = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            onUpdate(terakhir, pos.coords.accuracy);
        },
        () => {
            /* error diam: user bisa menolak izin */
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );

    return {
        stop: () => navigator.geolocation.clearWatch(id),
        titik: () => terakhir,
    };
}
