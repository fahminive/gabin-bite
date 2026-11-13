import { useEffect, useRef, useState } from 'react';
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
    LocateFixed,
    Play,
    ArrowUp,
    ArrowDown,
    ExternalLink,
    Square,
    UserRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LeafletMap } from '@/components/maps/leaflet-map';
import {
    titikDariAlamat,
    optimasiLokal,
    osrmTripOneWay,
    osrmTripRoundTrip,
    osrmRouteFixed,
    osrmLegs,
    formatJarak,
    formatDurasi,
    gmapsPerTitik,
    gpsSekarang,
    gpsWatch,
    isGmapsLink,
    simpanRute,
    muatRute,
    hapusRute,
    type GpsWatcher,
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
    status_penyerahan: string;
}

interface TitikManual {
    id: string;
    /** id penjualan bila titik ini atas nama pembeli tertentu */
    stopId?: number;
    nama: string;
    lat: number;
    lng: number;
}

interface Props {
    batches: Batch[];
    dapur: { latitude: number; longitude: number; nama: string } | null;
}

interface HasilRute {
    /** Stop keys urut kunjungan (id penjualan atau id titik manual "m:xxx") */
    urutanKunjungan: string[];
    geometri: Array<[number, number]>;
    garisPerTitik: Array<Array<[number, number]>>;
    jarakPerTitik: number[];
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
    const [loadingStops, setLoadingStops] = useState(false);
    // Mode mulai antar: titik yg sedang dituju (key stop)
    const [jalankan, setJalankan] = useState(false);
    const [titikAktifKey, setTitikAktifKey] = useState<string | null>(null);
    // Preferensi fokus: web atau gmaps saat klik Start
    const [fokusGmaps, setFokusGmaps] = useState(false);
    // Mode start: 'gps' = start dari posisi GPS realtime (rute terpotong
    // sepanjang GPS menginjak), 'dapur' = start statis dari dapur (rute
    // hilang per titik saat ditandai sampai)
    const [modeStart, setModeStart] = useState<'gps' | 'dapur'>('dapur');
    const [gpsAktif, setGpsAktif] = useState(false);
    const [posisiSaya, setPosisiSaya] = useState<{
        lat: number;
        lng: number;
        akurasi?: number;
    } | null>(null);
    const [sedangSetDapurGps, setSedangSetDapurGps] = useState(false);
    // Tinggi peta: normal / setengah layar / penuh
    const [ukuranPeta, setUkuranPeta] = useState<0 | 1 | 2>(0);
    const [selesaiSampai, setSelesaiSampai] = useState<Set<string>>(new Set());
    const watcherRef = useRef<GpsWatcher | null>(null);

    // ===== Muat rute tersimpan (tahan bolak-balik aplikasi) =====
    const [ruteDimuat, setRuteDimuat] = useState(false);
    useEffect(() => {
        const simpanan = muatRute();
        if (simpanan && simpanan.batchId === batchId) {
            setHasil({
                urutanKunjungan: simpanan.urutanKunjungan,
                geometri: [],
                garisPerTitik: [],
                jarakPerTitik: [],
                jarak: simpanan.jarak,
                durasi: simpanan.durasi,
            });
            setSelesaiSampai(new Set(simpanan.sudahSampai));
            setTitikAktifKey(simpanan.titikAktifKey);
            setJalankan(simpanan.titikAktifKey !== null);
            setModeStart(simpanan.modeStart);
            // refreshLegs effect akan menggambar ulang garis via OSRM
            setRuteDimuat(true);
        } else if (simpanan && simpanan.batchId !== batchId) {
            hapusRute();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ===== Simpan rute tiap berubah =====
    useEffect(() => {
        if (!hasil || !batchId) {
            return;
        }
        simpanRute({
            batchId,
            urutanKunjungan: hasil.urutanKunjungan,
            jarak: hasil.jarak,
            durasi: hasil.durasi,
            titikAktifKey,
            modeStart,
            sudahSampai: [...selesaiSampai],
            disimpanPada: Date.now(),
        });
    }, [hasil, batchId, titikAktifKey, modeStart, selesaiSampai]);

    // Matikan GPS watch saat halaman ditutup
    useEffect(() => {
        return () => {
            watcherRef.current?.stop();
        };
    }, []);

    function toggleGps() {
        if (gpsAktif) {
            watcherRef.current?.stop();
            watcherRef.current = null;
            setGpsAktif(false);
            setPosisiSaya(null);
            return;
        }

        const watcher = gpsWatch((titik, akurasi) => {
            setPosisiSaya({ ...titik, akurasi });
        });
        if (watcher) {
            watcherRef.current = watcher;
            setGpsAktif(true);
        } else {
            alert('GPS tidak tersedia di perangkat/browser ini.');
        }
    }

    /** Set dapur dari posisi GPS saat ini. */
    async function setDapurDariGps() {
        setSedangSetDapurGps(true);
        const titik = await gpsSekarang();
        setSedangSetDapurGps(false);
        if (!titik) {
            alert('Gagal mengambil GPS. Izinkan akses lokasi di browser, atau klik peta manual.');
            return;
        }
        await simpanDapur(titik.lat, titik.lng);
    }

    // Muat stop tiap ganti batch
    useEffect(() => {
        if (!batchId) {
            return;
        }
        setLoadingStops(true);
        setHasil(null);
        setTerpilih(new Set());
        setTitikManual([]);
        setJalankan(false);
        setTitikAktifKey(null);
        fetch(`/delivery-route/batches/${batchId}/stops`)
            .then((res) => res.json())
            .then((data) => {
                setStops(data.stops);
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

    /** Estimasi titik dari alamat/link gmaps lalu simpan ke backend. */
    async function estimasiTitik(stop: Stop) {
        if (!stop.alamat) {
            return;
        }
        setGeocodeTarget(stop.id);
        const titik = await titikDariAlamat(stop.alamat);
        setGeocodeTarget(null);

        if (!titik) {
            const petunjuk = isGmapsLink(stop.alamat)
                ? 'Link Google Maps ini tidak berisi koordinat yang bisa dibaca. Solusi: pin manual di peta (tombol "Pin Titik Manual").'
                : 'Alamat teks tidak ditemukan di peta. Solusi: pin manual di peta atau isi alamat lebih spesifik (nama jalan + kota).';
            alert(`Titik tidak ditemukan untuk "${stop.nama}".\n\n${petunjuk}`);
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
            setTitikManual((prev) => [
                ...prev,
                {
                    id: `m:${Date.now()}`,
                    nama: `Titik ${prev.length + 1}`,
                    lat,
                    lng,
                },
            ]);
            setModeTitikManual(false);
        }
    }

    /** Titik manual atas nama pembeli tertentu (alamat ngawur/terbaca salah). */
    function titikManualUntukStop(stop: Stop) {
        setModeTitikManual(true);
        setTitikManual((prev) => {
            // tandai: titik manual berikutnya atas nama stop ini
            pendingForStopRef.current = stop;
            return prev;
        });
    }
    const pendingForStopRef = useRef<Stop | null>(null);

    // Bungkus: setelah klik peta di mode manual, cek pendingForStopRef
    function onMapClickDenganStop(lat: number, lng: number) {
        if (modeTitikManual && pendingForStopRef.current) {
            const stop = pendingForStopRef.current;
            pendingForStopRef.current = null;
            setTitikManual((prev) => [
                ...prev,
                {
                    id: `m:${Date.now()}`,
                    stopId: stop.id,
                    nama: stop.nama,
                    lat,
                    lng,
                },
            ]);
            setModeTitikManual(false);
            return;
        }
        onMapClick(lat, lng);
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

    /** Key -> koordinat titik (stop atau manual). */
    function keyToTitik(key: string): LatLng | null {
        const stop = stops.find((s) => String(s.id) === key);
        if (stop && stop.punya_titik) {
            return { lat: stop.latitude!, lng: stop.longitude! };
        }
        const manual = titikManual.find((m) => m.id === key);
        if (manual) {
            return { lat: manual.lat, lng: manual.lng };
        }
        return null;
    }

    function keyToLabel(key: string): string {
        const stop = stops.find((s) => String(s.id) === key);
        if (stop) {
            return stop.nama;
        }
        return titikManual.find((m) => m.id === key)?.nama ?? key;
    }

    /** Hitung rute optimal via OSRM trip + fallback lokal, plus leg per titik. */
    async function hitungRute() {
        if (!dapur) {
            alert('Set lokasi dapur dulu: klik "Set Lokasi Dapur" atau "Dapur dari GPS".');
            return;
        }

        const dipilih: Array<{ key: string; titik: LatLng; label: string }> = [];

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

            let urutanInput: number[] = [];
            let geometri: Array<[number, number]> = [];
            let garisPerTitik: Array<Array<[number, number]>> = [];
            let jarakPerTitik: number[] = [];
            let jarak = 0;
            let durasi = 0;

            const rute = pulangKeDapur
                ? await osrmTripRoundTrip(koordinat)
                : await osrmTripOneWay(koordinat);

            if (rute) {
                urutanInput = rute.urutanInputKunjungan;
                geometri = rute.geometri;
                jarak = rute.jarak;
                durasi = rute.durasi;
            } else {
                urutanInput = optimasiLokal(
                    { lat: dapur.latitude, lng: dapur.longitude },
                    dipilih.map((d) => d.titik),
                    pulangKeDapur,
                );
                jarak = 0;
                const cur: LatLng = { lat: dapur.latitude, lng: dapur.longitude };
                const semua = [cur, ...urutanInput.map((i) => dipilih[i].titik)];
                if (pulangKeDapur) {
                    semua.push(cur);
                }
                for (let i = 0; i < semua.length - 1; i++) {
                    jarak += haversine(semua[i], semua[i + 1]);
                }
                durasi = Math.round((jarak / 1000 / 25) * 3600);
            }

            // Urutan final keys
            const urutanKunjungan = urutanInput.map((i) => dipilih[i].key);
            const urutanKoordinat = [
                { lat: dapur.latitude, lng: dapur.longitude },
                ...urutanInput.map((i) => dipilih[i].titik),
                ...(pulangKeDapur ? [{ lat: dapur.latitude, lng: dapur.longitude }] : []),
            ];

            // Leg per titik + jarak kumulatif utk tampilan per kunjungan
            const legs = await osrmLegs(urutanKoordinat);
            if (legs) {
                garisPerTitik = legs.geometriPerLeg;
                jarakPerTitik = legs.jarakPerTitik;
                if (!geometri.length) {
                    geometri = legs.geometriPerLeg.flat();
                    jarak = legs.jarak;
                    durasi = legs.durasi;
                }
            }

            setHasil({ urutanKunjungan, geometri, garisPerTitik, jarakPerTitik, jarak, durasi });
            setTitikAktifKey(null);
            setJalankan(false);
        } finally {
            setMenghitung(false);
        }
    }

    /** Jarak dua titik garis lurus (meter). */
    function haversine(a: LatLng, b: LatLng): number {
        const R = 6371000;
        const dLat = ((b.lat - a.lat) * Math.PI) / 180;
        const dLng = ((b.lng - a.lng) * Math.PI) / 180;
        const sLat =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((a.lat * Math.PI) / 180) *
                Math.cos((b.lat * Math.PI) / 180) *
                Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(sLat));
    }

    /** Mulai pengantaran: fokus ke titik pertama. */
    async function mulaiAntar() {
        if (!hasil || hasil.urutanKunjungan.length === 0) {
            return;
        }

        // Mode GPS butuh GPS aktif
        if (modeStart === 'gps' && !gpsAktif) {
            const langsung = await gpsSekarang();
            if (!langsung) {
                alert(
                    'Mode GPS butuh akses lokasi. Nyalakan "GPS Saya" dulu, atau pakai Mode Dapur.',
                );
                return;
            }
            setPosisiSaya({ ...langsung });
        }

        setJalankan(true);
        const pertama = hasil.urutanKunjungan.find((k) => !sudahSampai(k));
        if (!pertama) {
            return;
        }
        setTitikAktifKey(pertama);

        if (fokusGmaps) {
            const titik = keyToTitik(pertama);
            if (titik) {
                window.open(gmapsPerTitik(titik.lat, titik.lng), '_blank');
            }
        }
    }

    function berhentiAntar() {
        setJalankan(false);
        setTitikAktifKey(null);
    }

    /** Fokus peta + optionally buka gmaps utk titik tertentu. */
    function fokusTitik(key: string) {
        setTitikAktifKey(key);
        if (fokusGmaps) {
            const titik = keyToTitik(key);
            if (titik) {
                window.open(gmapsPerTitik(titik.lat, titik.lng), '_blank');
            }
        }
    }

    function sudahSampai(key: string): boolean {
        return selesaiSampai.has(key);
    }

    /** Tandai sampai: ubah status pembeli jadi sudah_diberikan di backend. */
    async function tandaiSampai(key: string) {
        const stop = stops.find((s) => String(s.id) === key);
        if (stop) {
            const csrf =
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch('/delivery-route/stops/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ id: stop.id }),
            });
            const data = (await res.json().catch(() => ({}))) as { ok?: boolean; pesan?: string };
            if (!res.ok || !data.ok) {
                alert(data.pesan ?? 'Gagal menandai sampai. Coba lagi.');
                return;
            }
            // Hapus dari daftar (sudah diserahkan tidak lagi ditampilkan)
            setStops((prev) => prev.filter((s) => s.id !== stop.id));
        }

        setSelesaiSampai((prev) => new Set(prev).add(key));

        // Lanjut otomatis ke titik berikutnya
        if (hasil) {
            const sisa = hasil.urutanKunjungan.filter(
                (k) => k !== key && !selesaiSampai.has(k),
            );
            if (sisa.length > 0) {
                setTitikAktifKey(sisa[0]);
                if (fokusGmaps) {
                    const titik = keyToTitik(sisa[0]);
                    if (titik) {
                        window.open(gmapsPerTitik(titik.lat, titik.lng), '_blank');
                    }
                }
            } else {
                setJalankan(false);
                setTitikAktifKey(null);
                alert('Semua titik sudah dikunjungi. Rute selesai!');
            }
        }
    }

    /** Geser urutan manual satu posisi. */
    function geserUrutan(key: string, arah: -1 | 1) {
        setHasil((prev) => {
            if (!prev) {
                return prev;
            }
            const urutan = [...prev.urutanKunjungan];
            const i = urutan.indexOf(key);
            const j = i + arah;
            if (i < 0 || j < 0 || j >= urutan.length) {
                return prev;
            }
            [urutan[i], urutan[j]] = [urutan[j], urutan[i]];
            return { ...prev, urutanKunjungan: urutan };
        });
    }

    /** Recalculate garis legs sesuai urutan manual terbaru (via OSRM legs). */
    async function refreshLegsUrutanBaru() {
        if (!hasil || !dapur) {
            return;
        }
        const koordinat: LatLng[] = [
            { lat: dapur.latitude, lng: dapur.longitude },
            ...(hasil.urutanKunjungan
                .map((k) => keyToTitik(k))
                .filter((t): t is LatLng => t !== null)),
            ...(pulangKeDapur ? [{ lat: dapur.latitude, lng: dapur.longitude }] : []),
        ];
        const legs = await osrmLegs(koordinat);
        if (legs) {
            setHasil((prev) =>
                prev
                    ? {
                          ...prev,
                          garisPerTitik: legs.geometriPerLeg,
                          jarakPerTitik: legs.jarakPerTitik,
                          geometri: legs.geometriPerLeg.flat(),
                          jarak: legs.jarak,
                          durasi: legs.durasi,
                      }
                    : prev,
            );
        }
    }

    // Saat urutan berubah manual ATAU rute dimuat dari localStorage (garis
    // kosong), refresh legs (debounce ringan via effect)
    useEffect(() => {
        if (!hasil) {
            return;
        }
        // Rute tersimpan punya garis kosong; wajib refresh utk menggambar
        const perluGaris = hasil.garisPerTitik.length === 0;
        if (!perluGaris && !ruteDimuat) {
            // urutan berubah saja -> refresh utk garis terbaru
        }
        const t = setTimeout(() => {
            void refreshLegsUrutanBaru();
        }, perluGaris ? 300 : 600);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasil?.urutanKunjungan, ruteDimuat]);

    // Index titik aktif utk peta (leg ke-n)
    const indexTitikAktif =
        hasil && titikAktifKey ? hasil.urutanKunjungan.indexOf(titikAktifKey) : null;

    /**
     * Mode GPS: hitung leg mana yang sudah "menginjak" posisi GPS (jarak
     * GPS ke salah satu ujung leg < 50m) - leg itu dan sebelumnya dihapus
     * dari garis, layaknya rute gmaps yang berkurang saat dikendarai.
     */
    const potonganGaris = (() => {
        if (modeStart !== 'gps' || !jalankan || !posisiSaya || !hasil?.garisPerTitik.length) {
            return null;
        }
        const dekat = (leg: Array<[number, number]>) => {
            const ujungA = leg[0];
            const ujungB = leg[leg.length - 1];
            const dA = haversine(
                posisiSaya,
                { lat: ujungA[0], lng: ujungA[1] },
            );
            const dB = haversine(
                posisiSaya,
                { lat: ujungB[0], lng: ujungB[1] },
            );
            return Math.min(dA, dB) < 50;
        };
        // Leg pertama yang BELUM dilewati = batas potongan
        for (let i = 0; i < hasil.garisPerTitik.length; i++) {
            if (!dekat(hasil.garisPerTitik[i])) {
                return i;
            }
        }
        return hasil.garisPerTitik.length;
    })();

    /** Marker utk peta: saat ada hasil urut kunjungan bernomor, saat belum urut nomor urut klik. */
    const markersUntukPeta = (() => {
        if (hasil) {
            const list: Array<{ lat: number; lng: number; label: string; nomor: number }> = [];
            hasil.urutanKunjungan.forEach((key, i) => {
                const titik = keyToTitik(key);
                if (titik) {
                    list.push({ lat: titik.lat, lng: titik.lng, label: keyToLabel(key), nomor: i + 1 });
                }
            });
            return list;
        }
        return [
            ...stops
                .filter((s) => terpilih.has(s.id) && s.punya_titik)
                .map((s) => ({ lat: s.latitude!, lng: s.longitude!, label: s.nama })),
            ...titikManual.map((m) => ({ lat: m.lat, lng: m.lng, label: m.nama })),
        ];
    })();

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
                            disabled={sedangSetDapurGps}
                            onClick={setDapurDariGps}
                        >
                            {sedangSetDapurGps ? (
                                <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <LocateFixed className="mr-1 h-3.5 w-3.5" />
                            )}
                            Dapur dari GPS
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
                            variant={gpsAktif ? 'default' : 'outline'}
                            size="sm"
                            className="h-9 rounded-xl text-xs"
                            onClick={toggleGps}
                        >
                            <LocateFixed className="mr-1 h-3.5 w-3.5" />
                            {gpsAktif ? 'GPS Aktif' : 'GPS Saya'}
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
                            {/* Kontrol ukuran peta */}
                            <div className="mb-2 flex items-center justify-end gap-1">
                                {([
                                    { mode: 0 as const, label: 'Kecil' },
                                    { mode: 1 as const, label: '50%' },
                                    { mode: 2 as const, label: 'Layar' },
                                ]).map(({ mode, label }) => (
                                    <Button
                                        key={mode}
                                        variant={ukuranPeta === mode ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-7 rounded-full px-2.5 text-[10px] font-bold"
                                        onClick={() => setUkuranPeta(mode)}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>
                            <LeafletMap
                                markers={markersUntukPeta}
                                dapur={dapur ? { lat: dapur.latitude, lng: dapur.longitude } : null}
                                polyline={!jalankan ? hasil?.geometri : undefined}
                                garisPerTitik={hasil?.garisPerTitik}
                                titikAktif={jalankan ? indexTitikAktif : null}
                                potongGarisSampai={potonganGaris}
                                titikSaya={posisiSaya}
                                onMapClick={onMapClickDenganStop}
                                tinggiClass={
                                    ukuranPeta === 0
                                        ? 'h-[380px] w-full rounded-xl md:h-[520px]'
                                        : ukuranPeta === 1
                                          ? 'h-[50vh] w-full rounded-xl'
                                          : 'h-[92vh] w-full rounded-xl'
                                }
                            />
                        </CardContent>
                    </Card>

                    {/* Panel daftar */}
                    <div className="space-y-3 lg:col-span-2">
                        {dapur === null && (
                            <Card className="rounded-2xl border-amber-500/40 bg-amber-500/5 shadow-xs">
                                <CardContent className="p-3.5 text-xs text-amber-800 dark:text-amber-300">
                                    Lokasi dapur belum di-set. Klik "Dapur dari GPS" (berdiri di
                                    dapur) atau "Set Lokasi Dapur" lalu klik peta.
                                </CardContent>
                            </Card>
                        )}

                        {/* Ringkasan rute + kontrol jalankan */}
                        {hasil && (
                            <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5 shadow-xs">
                                <CardHeader className="p-3.5 pb-1">
                                    <CardTitle className="flex items-center justify-between gap-2 text-sm font-bold">
                                        <span className="flex items-center gap-1.5">
                                            <Navigation className="h-4 w-4 text-emerald-600" />
                                            Rute {jalankan ? '(berjalan)' : ''}
                                        </span>
                                        <span className="text-xs font-semibold">
                                            {formatJarak(hasil.jarak)} - {formatDurasi(hasil.durasi)}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3.5 pt-0">
                                    {/* Mulai / berhenti + preferensi fokus */}
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        {!jalankan ? (
                                            <Button
                                                size="sm"
                                                className="h-8 rounded-xl text-xs font-bold"
                                                onClick={mulaiAntar}
                                            >
                                                <Play className="mr-1 h-3.5 w-3.5" />
                                                Start Antar
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 rounded-xl text-xs font-bold"
                                                onClick={berhentiAntar}
                                            >
                                                <Square className="mr-1 h-3.5 w-3.5" />
                                                Berhenti
                                            </Button>
                                        )}
                                        <Select
                                            value={modeStart}
                                            onValueChange={(v) => setModeStart(v as 'gps' | 'dapur')}
                                        >
                                            <SelectTrigger className="h-8 w-[130px] text-[11px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dapur">Mode Dapur</SelectItem>
                                                <SelectItem value="gps">Mode GPS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={fokusGmaps ? 'gmaps' : 'web'}
                                            onValueChange={(v) => setFokusGmaps(v === 'gmaps')}
                                        >
                                            <SelectTrigger className="h-8 w-[170px] text-[11px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="web">Fokus di web ini</SelectItem>
                                                <SelectItem value="gmaps">
                                                    Fokus via Google Maps
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {jalankan && modeStart === 'gps' && (
                                        <p className="mb-2 text-[10px] font-semibold text-muted-foreground">
                                            Mode GPS: rute terpotong otomatis sepanjang GPS
                                            menginjaknya. Nyalakan "GPS Saya" bila belum.
                                        </p>
                                    )}

                                    <ol className="space-y-1.5">
                                        {hasil.urutanKunjungan.map((key, i) => {
                                            const label = keyToLabel(key);
                                            const sudah = sudahSampai(key);
                                            const aktif = titikAktifKey === key;
                                            const titik = keyToTitik(key);
                                            const jarakLeg =
                                                hasil.jarakPerTitik[i] !== undefined
                                                    ? formatJarak(hasil.jarakPerTitik[i])
                                                    : null;
                                            const manual = titikManual.find((m) => m.id === key);
                                            return (
                                                <li
                                                    key={key}
                                                    className={`rounded-lg px-2 py-1.5 text-xs ${aktif ? 'bg-primary/10 ring-1 ring-primary/40' : sudah ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted/40'}`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="flex min-w-0 items-center gap-1.5">
                                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                                                {i + 1}
                                                            </span>
                                                            <span className="truncate font-semibold">
                                                                {label}
                                                            </span>
                                                            {manual?.stopId != null && (
                                                                <UserRound className="h-3 w-3 shrink-0 text-primary" />
                                                            )}
                                                            {jarakLeg && (
                                                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                                                    {jarakLeg}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="flex shrink-0 items-center gap-0.5">
                                                            <button
                                                                type="button"
                                                                aria-label="Naikkan urutan"
                                                                className="rounded p-1 hover:bg-muted"
                                                                onClick={() => geserUrutan(key, -1)}
                                                            >
                                                                <ArrowUp className="h-3 w-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                aria-label="Turunkan urutan"
                                                                className="rounded p-1 hover:bg-muted"
                                                                onClick={() => geserUrutan(key, 1)}
                                                            >
                                                                <ArrowDown className="h-3 w-3" />
                                                            </button>
                                                            {!sudah && titik && (
                                                                <a
                                                                    href={gmapsPerTitik(
                                                                        titik.lat,
                                                                        titik.lng,
                                                                    )}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="rounded p-1 text-primary hover:bg-muted"
                                                                    aria-label="Buka di gmaps"
                                                                >
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </a>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex justify-end">
                                                        {sudah ? (
                                                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Sampai
                                                            </span>
                                                        ) : (
                                                            <Button
                                                                variant={aktif ? 'default' : 'ghost'}
                                                                size="sm"
                                                                className="h-7 rounded-full px-2.5 text-[10px] font-bold"
                                                                onClick={() => tandaiSampai(key)}
                                                            >
                                                                <Circle className="mr-1 h-3 w-3" />
                                                                Tandai Sampai
                                                            </Button>
                                                        )}
                                                    </div>
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
                                                            <div className="flex gap-1">
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
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 rounded-full px-2 text-[10px] font-bold"
                                                                    onClick={() => titikManualUntukStop(stop)}
                                                                >
                                                                    <MapPinned className="mr-1 h-3 w-3" />
                                                                    Pin
                                                                </Button>
                                                            </div>
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
                                            Titik manual ({titikManual.length}) - bisa atas nama
                                            pembeli (ikon orang) atau nama sendiri
                                        </p>
                                        <div className="flex flex-col gap-1.5">
                                            {titikManual.map((m) => (
                                                <div key={m.id} className="flex items-center gap-1.5">
                                                    {m.stopId != null ? (
                                                        <UserRound className="h-3.5 w-3.5 shrink-0 text-primary" />
                                                    ) : (
                                                        <MapPinned className="h-3.5 w-3.5 shrink-0 text-primary" />
                                                    )}
                                                    <Input
                                                        value={m.nama}
                                                        onChange={(e) =>
                                                            setTitikManual((prev) =>
                                                                prev.map((x) =>
                                                                    x.id === m.id
                                                                        ? { ...x, nama: e.target.value }
                                                                        : x,
                                                                ),
                                                            )
                                                        }
                                                        className="h-8 rounded-lg text-xs"
                                                        aria-label="Nama titik manual"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setTitikManual((prev) =>
                                                                prev.filter((x) => x.id !== m.id),
                                                            )
                                                        }
                                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-destructive transition-colors active:bg-destructive/10"
                                                        aria-label={`Hapus ${m.nama}`}
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
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
