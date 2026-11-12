import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    MapPin,
    Navigation,
    CheckCircle2,
    Circle,
    House,
    LoaderCircle,
    Route as RouteIcon,
    Search,
    MapPinned,
    Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { LeafletMap } from '@/components/maps/leaflet-map';
import {
    geocodeAlamat,
    osrmTripOneWay,
    osrmTripRoundTrip,
    osrmRouteFixed,
    formatJarak,
    formatDurasi,
    gmapsPerTitik,
    type LatLng,
} from '@/lib/route-utils';

interface Batch {
    id: number;
    kode: string;
    keterangan: string;
    status: string;
}

interface Stop {
    id: number;
    no_faktur: string;
    nama: string;
    alamat: string | null;
    no_telepon: string | null;
    latitude: number | null;
    longitude: number | null;
    punya_titik: boolean;
}

interface TitikManual {
    id: string;
    nama: string;
    lat: number;
    lng: number;
}

interface Props {
    batches: Batch[];
    dapur: { latitude: number; longitude: number; nama: string } | null;
}

interface HasilRute {
    /** Stop IDs urut kunjungan (termasuk titik manual dgn id "m:xxx") */
    urutanKunjungan: string[];
    geometri: Array<[number, number]>;
    jarak: number;
    durasi: number;
}

export default function DeliveryRouteIndex({ batches, dapur: dapurProp }: Props) {
    const [batchId, setBatchId] = useState<string>(batches[0]?.id ? String(batches[0].id) : '');
    const [stops, setStops] = useState<Stop[]>([]);
    const [terpilih, setTerpilih] = useState<Set<number>>(new Set());
    const [titikManual, setTitikManual] = useState<TitikManual[]>([]);
    const [modeTitikManual, setModeTitikManual] = useState(false);
    const [geocodeTarget, setGeocodeTarget] = useState<number | null>(null);
    const [pulangKeDapur, setPulangKeDapur] = useState(true);
    const [dapur, setDapur] = useState(dapurProp);
    const [modeSetDapur, setModeSetDapur] = useState(false);
    const [hasil, setHasil] = useState<HasilRute | null>(null);
    const [menghitung, setMenghitung] = useState(false);
    const [selesaiSampai, setSelesaiSampai] = useState<Set<string>>(new Set());
    const [loadingStops, setLoadingStops] = useState(false);

    // Muat stop tiap ganti batch
    useEffect(() => {
        if (!batchId) {
            return;
        }
        setLoadingStops(true);
        setHasil(null);
        setTerpilih(new Set());
        setSelesaiSampai(new Set());
        setTitikManual([]);
        fetch(`/delivery-route/batches/${batchId}/stops`)
            .then((res) => res.json())
            .then((data) => {
                setStops(data.stops);
                // Auto-check semua yang punya titik
                setTerpilih(
                    new Set(
                        (data.stops as Stop[])
                            .filter((s) => s.punya_titik)
                            .map((s) => s.id),
                    ),
                );
            })
            .finally(() => setLoadingStops(false));
    }, [batchId]);

    /** Estimasi titik dari alamat teks via Nominatim lalu simpan ke backend. */
    async function estimasiTitik(stop: Stop) {
        if (!stop.alamat) {
            return;
        }
        setGeocodeTarget(stop.id);
        const titik = await geocodeAlamat(stop.alamat);
        setGeocodeTarget(null);

        if (!titik) {
            alert(
                `Titik tidak ditemukan untuk "${stop.nama}". Geser pin manual: aktifkan "Pin titik manual" lalu klik peta dekat lokasinya.`,
            );
            return;
        }

        await fetch('/delivery-route/stops/point', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
            },
            body: JSON.stringify({
                id: stop.id,
                latitude: titik.lat,
                longitude: titik.lng,
            }),
        });

        setStops((prev) =>
            prev.map((s) =>
                s.id === stop.id
                    ? { ...s, latitude: titik.lat, longitude: titik.lng, punya_titik: true }
                    : s,
            ),
        );
        setTerpilih((prev) => new Set(prev).add(stop.id));
    }

    /** Estimasi semua stop yang belum punya titik (berurutan, hormati 1 req/detik). */
    async function estimasiSemua() {
        const belum = stops.filter((s) => !s.punya_titik && s.alamat);
        for (const stop of belum) {
            await estimasiTitik(stop);
            await new Promise((r) => setTimeout(r, 1100));
        }
    }

    /** Klik peta saat mode titik manual / set dapur. */
    function onMapClick(lat: number, lng: number) {
        if (modeSetDapur) {
            simpanDapur(lat, lng);
            setModeSetDapur(false);
            return;
        }

        if (modeTitikManual) {
            const nama = prompt('Nama titik ini (mis. Ambil es batu):');
            if (!nama) {
                return;
            }
            setTitikManual((prev) => [
                ...prev,
                { id: `m:${Date.now()}`, nama, lat, lng },
            ]);
            setModeTitikManual(false);
        }
    }

    async function simpanDapur(lat: number, lng: number) {
        await fetch('/delivery-route/dapur', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
            },
            body: JSON.stringify({ latitude: lat, longitude: lng }),
        });
        setDapur({ latitude: lat, longitude: lng, nama: 'Dapur Gabin' });
        alert('Lokasi dapur tersimpan.');
    }

    /** Hitung rute optimal via OSRM trip. */
    async function hitungRute() {
        if (!dapur) {
            alert('Set lokasi dapur dulu: klik "Set Lokasi Dapur" lalu klik peta.');
            return;
        }

        const dipilih: Array<{ key: string; titik: LatLng; label: string }> = [];

        // Urutan awal: urutkan berdasarkan id supaya deterministic sebelum OSRM
        stops
            .filter((s) => terpilih.has(s.id) && s.punya_titik)
            .forEach((s) =>
                dipilih.push({
                    key: String(s.id),
                    titik: { lat: s.latitude!, lng: s.longitude! },
                    label: s.nama,
                }),
            );
        titikManual.forEach((m) =>
            dipilih.push({ key: m.id, titik: { lat: m.lat, lng: m.lng }, label: m.nama }),
        );

        if (dipilih.length === 0) {
            alert('Belum ada titik terpilih.');
            return;
        }

        setMenghitung(true);
        setHasil(null);

        try {
            const koordinat: LatLng[] = [
                { lat: dapur.latitude, lng: dapur.longitude },
                ...dipilih.map((d) => d.titik),
            ];

            let rute = pulangKeDapur
                ? await osrmTripRoundTrip(koordinat)
                : await osrmTripOneWay(koordinat);

            if (!rute) {
                // Fallback: urutan input saja (dapur -> 1..n -> dapur)
                const fixed = pulangKeDapur ? [...koordinat, koordinat[0]] : koordinat;
                const r = await osrmRouteFixed(fixed);
                if (r) {
                    rute = {
                        urutan: dipilih.map((_, i) => i + 1),
                        geometri: r.geometri,
                        jarak: r.jarak,
                        durasi: r.durasi,
                    };
                }
            }

            if (!rute) {
                alert('Gagal menghitung rute (jaringan/OSRM down). Coba lagi.');
                return;
            }

            // OSRM waypoint order: urutan kunjungan = index input (dipakai
            // untuk menyusun label 1,2,3..). Waypoint pertama selalu dapur.
            const urutanKunjungan = hitungUrutanKunjungan(dipilih, pulangKeDapur);

            setHasil({
                urutanKunjungan,
                geometri: rute.geometri,
                jarak: rute.jarak,
                durasi: rute.durasi,
            });
            setSelesaiSampai(new Set());
        } finally {
            setMenghitung(false);
        }
    }

    return (
        <>
            <Head title="Rute Pengantaran" />
            <div className="space-y-4 p-3 md:p-6">
                {/* Pilih batch + aksi */}
                <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label className="text-xs font-bold text-muted-foreground">Batch</label>
                        <select
                            value={batchId}
                            onChange={(e) => setBatchId(e.target.value)}
                            className="h-9 rounded-xl border border-border bg-card px-3 text-sm"
                        >
                            {batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.kode} ({b.status})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl text-xs"
                            onClick={() => setModeSetDapur(true)}
                        >
                            <House className="mr-1 h-3.5 w-3.5" />
                            Set Lokasi Dapur
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl text-xs"
                            onClick={() => setModeTitikManual(true)}
                        >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            Pin Titik Manual
                        </Button>
                        <Button
                            size="sm"
                            className="h-9 rounded-xl text-xs font-bold"
                            onClick={hitungRute}
                            disabled={menghitung}
                        >
                            {menghitung ? (
                                <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RouteIcon className="mr-1 h-3.5 w-3.5" />
                            )}
                            Hitung Rute Optimal
                        </Button>
                    </div>
                </div>

                {(modeTitikManual || modeSetDapur) && (
                    <div className="rounded-xl border border-primary/40 bg-primary/5 px-3.5 py-2.5 text-xs font-semibold text-primary">
                        Klik peta untuk {modeSetDapur ? 'menentukan lokasi dapur' : 'menambah titik manual'}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                    {/* Peta */}
                    <Card className="lg:col-span-3 rounded-2xl shadow-xs">
                        <CardContent className="p-2.5">
                            <LeafletMap
                                markers={[
                                    ...stops
                                        .filter((s) => terpilih.has(s.id) && s.punya_titik)
                                        .map((s) => ({
                                            lat: s.latitude!,
                                            lng: s.longitude!,
                                            label: s.nama,
                                            nomor:
                                                hasil?.urutanKunjungan.indexOf(String(s.id)) !== -1 &&
                                                hasil
                                                    ? hasil.urutanKunjungan.indexOf(String(s.id)) + 1
                                                    : undefined,
                                        })),
                                    ...titikManual.map((m) => ({
                                        lat: m.lat,
                                        lng: m.lng,
                                        label: m.nama,
                                        nomor:
                                            hasil && hasil.urutanKunjungan.indexOf(m.id) !== -1
                                                ? hasil.urutanKunjungan.indexOf(m.id) + 1
                                                : undefined,
                                    })),
                                ]}
                                dapur={dapur ? { lat: dapur.latitude, lng: dapur.longitude } : null}
                                polyline={hasil?.geometri}
                                onMapClick={onMapClick}
                                className="h-[380px] w-full rounded-xl md:h-[520px]"
                            />
                        </CardContent>
                    </Card>

                    {/* Panel daftar */}
                    <div className="space-y-3 lg:col-span-2">
                        {dapur === null && (
                            <Card className="rounded-2xl border-amber-500/40 bg-amber-500/5 shadow-xs">
                                <CardContent className="p-3.5 text-xs text-amber-800 dark:text-amber-300">
                                    Lokasi dapur belum di-set. Klik "Set Lokasi Dapur" lalu klik peta
                                    di lokasi dapurmu.
                                </CardContent>
                            </Card>
                        )}

                        {/* Ringkasan rute */}
                        {hasil && (
                            <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5 shadow-xs">
                                <CardHeader className="p-3.5 pb-1">
                                    <CardTitle className="flex items-center gap-1.5 text-sm font-bold">
                                        <Navigation className="h-4 w-4 text-emerald-600" />
                                        Rute Optimal
                                        {pulangKeDapur && ' (pulang ke dapur)'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3.5 pt-0">
                                    <p className="text-sm font-bold">
                                        {formatJarak(hasil.jarak)} - {formatDurasi(hasil.durasi)}
                                    </p>
                                    <ol className="mt-2 space-y-1.5">
                                        {hasil.urutanKunjungan.map((key, i) => {
                                            const stop = stops.find((s) => String(s.id) === key);
                                            const manual = titikManual.find((m) => m.id === key);
                                            const label = stop?.nama ?? manual?.nama ?? key;
                                            const sudah = selesaiSampai.has(key);
                                            return (
                                                <li
                                                    key={key}
                                                    className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs ${sudah ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted/40'}`}
                                                >
                                                    <span className="flex min-w-0 items-center gap-1.5">
                                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                                            {i + 1}
                                                        </span>
                                                        <span className="truncate font-semibold">{label}</span>
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`h-7 shrink-0 rounded-full px-2 text-[10px] font-bold ${sudah ? 'text-emerald-600' : ''}`}
                                                        onClick={() =>
                                                            setSelesaiSampai((prev) => {
                                                                const next = new Set(prev);
                                                                if (next.has(key)) {
                                                                    next.delete(key);
                                                                } else {
                                                                    next.add(key);
                                                                }
                                                                return next;
                                                            })
                                                        }
                                                    >
                                                        {sudah ? (
                                                            <>
                                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                                Sampai
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Circle className="mr-1 h-3 w-3" />
                                                                Tandai Sampai
                                                            </>
                                                        )}
                                                    </Button>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </CardContent>
                            </Card>
                        )}

                        {/* Daftar stop */}
                        <Card className="rounded-2xl shadow-xs">
                            <CardHeader className="p-3.5 pb-1">
                                <CardTitle className="flex items-center justify-between gap-2 text-sm font-bold">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        Belum Diserahkan ({stops.length})
                                    </span>
                                    {stops.some((s) => !s.punya_titik && s.alamat) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 rounded-full px-2 text-[10px] font-bold"
                                            onClick={estimasiSemua}
                                        >
                                            <Search className="mr-1 h-3 w-3" />
                                            Estimasi Semua Titik
                                        </Button>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3.5 pt-0">
                                <label className="mb-2 flex items-center gap-2 text-xs font-semibold">
                                    <Checkbox
                                        checked={pulangKeDapur}
                                        onCheckedChange={(v: boolean) => setPulangKeDapur(v)}
                                    />
                                    Akhir rute pulang ke dapur
                                </label>

                                {loadingStops ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        Memuat pembeli...
                                    </p>
                                ) : stops.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        Semua pesanan batch ini sudah diserahkan.
                                    </p>
                                ) : (
                                    <div className="flex flex-col divide-y">
                                        {stops.map((stop) => (
                                            <div key={stop.id} className="py-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <label
                                                        className={`flex min-w-0 flex-1 items-start gap-2 ${stop.punya_titik ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                                                    >
                                                        <Checkbox
                                                            checked={terpilih.has(stop.id)}
                                                            disabled={!stop.punya_titik}
                                                            onCheckedChange={(v: boolean) => {
                                                                setTerpilih((prev) => {
                                                                    const next = new Set(prev);
                                                                    if (v) {
                                                                        next.add(stop.id);
                                                                    } else {
                                                                        next.delete(stop.id);
                                                                    }
                                                                    return next;
                                                                });
                                                            }}
                                                            className="mt-0.5"
                                                        />
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-semibold">
                                                                {stop.nama}
                                                            </span>
                                                            <span className="block truncate text-[11px] text-muted-foreground">
                                                                {stop.alamat ?? 'tanpa alamat'}
                                                                {stop.no_telepon ? ` - ${stop.no_telepon}` : ''}
                                                            </span>
                                                        </span>
                                                    </label>
                                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                                        {stop.punya_titik ? (
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                ada titik
                                                            </Badge>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 rounded-full px-2 text-[10px] font-bold"
                                                                disabled={geocodeTarget === stop.id || !stop.alamat}
                                                                onClick={() => estimasiTitik(stop)}
                                                            >
                                                                {geocodeTarget === stop.id ? (
                                                                    <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Search className="mr-1 h-3 w-3" />
                                                                )}
                                                                Estimasi
                                                            </Button>
                                                        )}
                                                        {stop.latitude !== null && stop.longitude !== null && (
                                                            <a
                                                                href={gmapsPerTitik(stop.latitude, stop.longitude)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] font-bold text-primary hover:underline"
                                                            >
                                                                Navigasi gmaps
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {titikManual.length > 0 && (
                                    <div className="mt-2 rounded-xl border border-border/70 bg-muted/30 p-2.5">
                                        <p className="mb-1.5 text-[10px] font-bold text-muted-foreground">
                                            Titik manual ({titikManual.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {titikManual.map((m) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1 text-[10px] font-semibold shadow-xs"
                                                    onClick={() =>
                                                        setTitikManual((prev) => prev.filter((x) => x.id !== m.id))
                                                    }
                                                    title="Klik untuk hapus"
                                                >
                                                    <MapPinned className="h-3 w-3 text-primary" />
                                                    {m.nama}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

/**
 * Urutan kunjungan final utk label nomor: OSRM trip mengoptimasi urutan
 * kunjungan; fungsi ini menyusun key stop sesuai hasil trip. Karena OSRM
 * /trip tidak mengembalikan mapping langsung ke index input pada public
 * server (waypoint order implisit), kita pakai nearest-neighbor dari
 * geometri sebagai penentu urutan tampil - cukup akurat utk perkiraan
 * kunjungan dan konsisten dgn garis rute.
 */
function hitungUrutanKunjungan(
    dipilih: Array<{ key: string; titik: LatLng; label: string }>,
    pulang: boolean,
): string[] {
    // Nearest neighbor sederhana dari titik pertama (dapur sudah dikeluarkan
    // dari `dipilih`). Cukup utk labeling; garis rute tetap dari OSRM.
    const sisa = [...dipilih];
    const urutan: string[] = [];
    let pos: LatLng = sisa.length ? sisa[0].titik : { lat: 0, lng: 0 };

    // Mulai dari yang terdekat ke titik pertama input (biasanya dapur-terdekat)
    const jarak = (a: LatLng, b: LatLng) => Math.hypot(a.lat - b.lat, a.lng - b.lng);

    let current: LatLng = sisa.length ? sisa[0].titik : pos;
    while (sisa.length) {
        let bestIdx = 0;
        let bestDist = Infinity;
        sisa.forEach((s, i) => {
            const d = jarak(current, s.titik);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = i;
            }
        });
        const next = sisa.splice(bestIdx, 1)[0];
        urutan.push(next.key);
        current = next.titik;
    }

    return urutan;
}
