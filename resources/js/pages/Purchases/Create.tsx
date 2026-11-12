import { Head } from '@inertiajs/react';
import { useForm, router } from '@inertiajs/react';
import { Plus, Trash2, ShoppingCart, ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import * as purchasesAction from '@/actions/App/Http/Controllers/PembelianController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatRupiah } from '@/lib/utils';

interface BahanBaku {
    id: number;
    nama_bahan: string;
    satuan: string;
    harga_satuan: number;
    netto_pcs: number | null;
}

interface Pemasok {
    id: number;
    nama_pemasok: string;
}

interface MetodePembayaran {
    id: number;
    nama_metode: string;
}

interface Mitra {
    id: number;
    kode: string;
    nama: string;
}

interface Batch {
    id: number;
    kode: string;
    keterangan: string;
}

interface Props {
    bahanBakus: BahanBaku[];
    pemasoks: Pemasok[];
    metodePembayarans: MetodePembayaran[];
    mitras: Mitra[];
    batches: Batch[];
}

interface Item {
    bahan_baku_id: string;
    qty: string;
    qty_bungkus: string;
    beli_per_bungkus: boolean;
    harga_satuan: string;
    /** Mode input harga: per satuan atau total untuk semua qty. */
    harga_mode: 'satuan' | 'total';
    /** Nilai harga total (dipakai saat harga_mode = 'total'). */
    harga_total: string;
    netto_pcs: number | null;
    qty_masuk_stok?: number;
}

export default function PurchasesCreate({
    bahanBakus = [],
    pemasoks = [],
    metodePembayarans = [],
    mitras = [],
    batches = [],
}: Props) {
    const [items, setItems] = useState<Item[]>([
        {
            bahan_baku_id: '',
            qty: '',
            qty_bungkus: '',
            beli_per_bungkus: false,
            harga_satuan: '',
            harga_mode: 'satuan',
            harga_total: '',
            netto_pcs: null,
        },
    ]);

    const form = useForm({
        pemasok_id: '',
        metode_pembayaran_id: '',
        sumber_dana: 'pribadi',
        mitra_id: '',
        pre_order_id: '',
        nama_pembelian: '',
        items: [] as Item[],
    });

    function addItem() {
        setItems((prev) => [
            ...prev,
            {
                bahan_baku_id: '',
                qty: '',
                qty_bungkus: '',
                beli_per_bungkus: false,
                harga_satuan: '',
                harga_mode: 'satuan',
                harga_total: '',
                netto_pcs: null,
            },
        ]);
    }

    function removeItem(index: number) {
        if (items.length === 1) {
            return;
        }

        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    function updateItem(
        index: number,
        field: keyof Item,
        value: string | boolean,
    ) {
        setItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            // Auto-fill harga_satuan dan netto_pcs dari master data saat bahan dipilih
            if (field === 'bahan_baku_id') {
                const bahan = bahanBakus.find((b) => b.id === Number(value));

                if (bahan) {
                    updated[index].harga_satuan = String(bahan.harga_satuan);
                    updated[index].netto_pcs = bahan.netto_pcs ?? null;
                }
            }

            return updated;
        });
    }

    function toggleBeliPerBungkus(index: number, checked: boolean) {
        setItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], beli_per_bungkus: checked };

            // Bersihkan qty yang tidak dipakai
            if (checked) {
                updated[index].qty = '';
            } else {
                updated[index].qty_bungkus = '';
            }

            return updated;
        });
    }

    /**
     * Ganti mode input harga satuan <-> total. Nilai yang sudah diketik
     * dikonversi agar tidak "hilang": satuan x qty = total, total / qty
     * = satuan.
     */
    function toggleHargaMode(index: number) {
        setItems((prev) => {
            const updated = [...prev];
            const item = updated[index];
            const qty = effectiveQty(item);

            if (item.harga_mode === 'satuan') {
                updated[index] = {
                    ...item,
                    harga_mode: 'total',
                    harga_total:
                        qty > 0
                            ? String(
                                  Math.round(
                                      Number(item.harga_satuan || 0) * qty,
                                  ),
                              )
                            : item.harga_total,
                };
            } else {
                updated[index] = {
                    ...item,
                    harga_mode: 'satuan',
                    harga_satuan:
                        qty > 0
                            ? String(
                                  Math.round(
                                      (Number(item.harga_total || 0) / qty) *
                                          100,
                                  ) / 100,
                              )
                            : item.harga_satuan,
                };
            }

            return updated;
        });
    }

    function effectiveQty(item: Item): number {
        if (item.beli_per_bungkus) {
            return Math.max(
                Number(item.qty_bungkus) * Number(item.netto_pcs || 0),
                0,
            );
        }

        return Math.max(Number(item.qty), 0);
    }

    /**
     * Harga satuan efektif: saat mode 'total', harga yang diketik user
     * adalah untuk SELURUH qty masuk stok, dibagi rata per satuan.
     * Contoh: 12 pcs susu Rp66.000 total -> satuan 5.500.
     */
    function effectiveHargaSatuan(item: Item): number {
        const qty = effectiveQty(item);
        if (item.harga_mode === 'total') {
            if (qty <= 0) {
                return 0;
            }
            return Number(item.harga_total || 0) / qty;
        }

        return Number(item.harga_satuan || 0);
    }

    function calculateSubtotal(item: Item): number {
        if (item.harga_mode === 'total') {
            return Math.max(Number(item.harga_total || 0), 0);
        }

        return effectiveQty(item) * Number(item.harga_satuan || 0);
    }

    function calculateTotal(): number {
        return items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
    }

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const action = purchasesAction.store();
        form.transform((data) => ({
            ...data,
            items: items.map((item) => ({
                ...item,
                qty_masuk_stok: effectiveQty(item),
                // Backend selalu menerima harga satuan; mode total
                // dibagi rata per qty di sini.
                harga_satuan: effectiveHargaSatuan(item),
            })),
        }));
        form.submit(action.method, action.url, {
            onSuccess: () => {
                toast.success('Pembelian bahan tercatat.');
            },
            onError: () => {
                toast.error(
                    'Terdapat kesalahan pada form. Silakan periksa kembali.',
                );
            },
        });
    }

    return (
        <>
            <Head title="Pembelian Bahan Baku" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <form onSubmit={submit} className="max-w-4xl space-y-6">
                    {/* Header Pembelian */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Beli bahan sesuai kuantitas pesanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="nama_pembelian">
                                        Nama / Keterangan Pembelian
                                    </FieldLabel>
                                    <Input
                                        id="nama_pembelian"
                                        placeholder="Contoh: Bahan batch pre-order weekend"
                                        value={form.data.nama_pembelian}
                                        onChange={(e) =>
                                            form.setData(
                                                'nama_pembelian',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {form.errors.nama_pembelian && (
                                        <FieldError>
                                            {form.errors.nama_pembelian}
                                        </FieldError>
                                    )}
                                </Field>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor="pemasok_id">
                                            Pemasok
                                        </FieldLabel>
                                        <Select
                                            value={form.data.pemasok_id}
                                            onValueChange={(val) =>
                                                form.setData('pemasok_id', val)
                                            }
                                        >
                                            <SelectTrigger
                                                id="pemasok_id"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Pilih pemasok" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {pemasoks.map((p) => (
                                                    <SelectItem
                                                        key={p.id}
                                                        value={String(p.id)}
                                                    >
                                                        {p.nama_pemasok}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.pemasok_id && (
                                            <FieldError>
                                                {form.errors.pemasok_id}
                                            </FieldError>
                                        )}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="metode_pembayaran_id">
                                            Metode Pembayaran
                                        </FieldLabel>
                                        <Select
                                            value={
                                                form.data.metode_pembayaran_id
                                            }
                                            onValueChange={(val) =>
                                                form.setData(
                                                    'metode_pembayaran_id',
                                                    val,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="metode_pembayaran_id"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Pilih metode" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {metodePembayarans.map((m) => (
                                                    <SelectItem
                                                        key={m.id}
                                                        value={String(m.id)}
                                                    >
                                                        {m.nama_metode}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.metode_pembayaran_id && (
                                            <FieldError>
                                                {
                                                    form.errors
                                                        .metode_pembayaran_id
                                                }
                                            </FieldError>
                                        )}
                                    </Field>
                                </div>

                                <Field>
                                    <FieldLabel htmlFor="sumber_dana">
                                        Sumber Dana Pembiayaan
                                    </FieldLabel>
                                    <Select
                                        value={form.data.sumber_dana}
                                        onValueChange={(val) => {
                                            form.setData('sumber_dana', val);

                                            if (val === 'simpanan_usaha') {
                                                form.setData('mitra_id', '');
                                            }
                                        }}
                                    >
                                        <SelectTrigger
                                            id="sumber_dana"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Pilih sumber dana" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem
                                                key="pribadi"
                                                value="pribadi"
                                            >
                                                Pribadi (Partner membayar
                                                sendiri)
                                            </SelectItem>
                                            <SelectItem
                                                key="simpanan_usaha"
                                                value="simpanan_usaha"
                                            >
                                                Simpanan Usaha (dari tabungan
                                                bisnis)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.errors.sumber_dana && (
                                        <FieldError>
                                            {form.errors.sumber_dana}
                                        </FieldError>
                                    )}
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Pilih <strong>Pribadi</strong> jika
                                        partner membayar dari uang sendiri (akan
                                        dibagi di Split Bill). Pilih{' '}
                                        <strong>Simpanan Usaha</strong> jika
                                        dibiayai dari tabungan bisnis (tidak ada
                                        utang partner).
                                    </p>
                                </Field>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor="pre_order_id">
                                            Batch Pre-Order (opsional)
                                        </FieldLabel>
                                        <Select
                                            value={
                                                form.data.pre_order_id || 'none'
                                            }
                                            onValueChange={(val) =>
                                                form.setData(
                                                    'pre_order_id',
                                                    val === 'none' ? '' : val,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="pre_order_id"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Tanpa batch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    Tanpa batch
                                                </SelectItem>
                                                {batches.map((batch) => (
                                                    <SelectItem
                                                        key={batch.id}
                                                        value={String(batch.id)}
                                                    >
                                                        {batch.kode} -{' '}
                                                        {batch.keterangan}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.pre_order_id && (
                                            <FieldError>
                                                {form.errors.pre_order_id}
                                            </FieldError>
                                        )}
                                    </Field>
                                </div>

                                {form.data.sumber_dana === 'pribadi' && (
                                    <Field>
                                        <FieldLabel htmlFor="mitra_id">
                                            Partner yang membayar (wajib)
                                        </FieldLabel>
                                        <Select
                                            value={form.data.mitra_id}
                                            onValueChange={(val) =>
                                                form.setData('mitra_id', val)
                                            }
                                        >
                                            <SelectTrigger
                                                id="mitra_id"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Pilih Partner A, B, atau C" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {mitras.map((m) => (
                                                    <SelectItem
                                                        key={m.id}
                                                        value={String(m.id)}
                                                    >
                                                        {m.kode} - {m.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.mitra_id && (
                                            <FieldError>
                                                {form.errors.mitra_id}
                                            </FieldError>
                                        )}
                                    </Field>
                                )}

                                {mitras.length > 0 &&
                                    form.data.sumber_dana === 'pribadi' && (
                                        <p className="text-sm text-muted-foreground">
                                            Pembelian{' '}
                                            {formatRupiah(calculateTotal())}{' '}
                                            akan dibagi rata ke {mitras.length}{' '}
                                            partner dan dicatat di menu Split
                                            Bill.
                                        </p>
                                    )}
                                {mitras.length > 0 &&
                                    form.data.sumber_dana ===
                                        'simpanan_usaha' && (
                                        <p className="text-sm text-muted-foreground">
                                            Pembelian{' '}
                                            {formatRupiah(calculateTotal())}{' '}
                                            akan dibiayai dari Simpanan Usaha.
                                            Tidak ada utang partner yang
                                            terbentuk.
                                        </p>
                                    )}
                            </FieldGroup>
                        </CardContent>
                    </Card>

                    {/* Detail Items */}
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base font-bold">
                                    Detail Bahan Baku
                                </CardTitle>
                                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground md:hidden">
                                    <ArrowLeftRight className="h-3 w-3 animate-pulse text-primary" />{' '}
                                    Geser tabel untuk input kolom
                                </span>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addItem}
                                className="h-8 rounded-xl text-xs"
                            >
                                <Plus className="mr-1 h-3.5 w-3.5" /> Tambah
                                Baris
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {/* Mobile: kartu per item */}
                            <div className="flex flex-col gap-3 md:hidden">
                                {items.map((item, index) => {
                                    const bahan = bahanBakus.find(
                                        (b) =>
                                            b.id ===
                                            Number(item.bahan_baku_id),
                                    );
                                    const satuan = bahan?.satuan ?? '-';
                                    const masukStok = effectiveQty(item);

                                    return (
                                        <div
                                            key={index}
                                            className="rounded-xl border border-border/70 bg-card p-3 shadow-xs"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-muted-foreground">
                                                    Item {index + 1}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(index)}
                                                    disabled={items.length === 1}
                                                    className="h-9 w-9 text-destructive hover:text-destructive"
                                                    aria-label="Hapus item"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="mt-2 flex flex-col gap-2">
                                                <Select
                                                    value={item.bahan_baku_id}
                                                    onValueChange={(val) =>
                                                        updateItem(index, 'bahan_baku_id', val)
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Pilih bahan baku" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {bahanBakus.map((b) => (
                                                            <SelectItem key={b.id} value={String(b.id)}>
                                                                {b.nama_bahan} ({b.satuan})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {(form.errors as any)[`items.${index}.bahan_baku_id`] && (
                                                    <p className="text-xs text-destructive">
                                                        {(form.errors as any)[`items.${index}.bahan_baku_id`]}
                                                    </p>
                                                )}
                                                {item.netto_pcs != null && (
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Netto/Pcs: {item.netto_pcs} {satuan}
                                                    </p>
                                                )}
                                                <label className="flex items-center gap-2 text-xs">
                                                    <Checkbox
                                                        checked={item.beli_per_bungkus}
                                                        onCheckedChange={(checked: boolean) =>
                                                            toggleBeliPerBungkus(index, checked)
                                                        }
                                                    />
                                                    Beli per bungkus
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                                                            Qty
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            placeholder="0"
                                                            value={
                                                                item.beli_per_bungkus
                                                                    ? item.qty_bungkus
                                                                    : item.qty
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    item.beli_per_bungkus
                                                                        ? 'qty_bungkus'
                                                                        : 'qty',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                        <p className="mt-1 text-[10px] leading-none text-muted-foreground">
                                                            Masuk stok: {masukStok} {satuan}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <div className="mb-1 flex items-center justify-between gap-1">
                                                            <label className="block text-[11px] font-semibold text-muted-foreground">
                                                                {item.harga_mode === 'total' ? 'Harga Total (Rp)' : 'Harga Satuan (Rp)'}
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleHargaMode(index)
                                                                }
                                                                className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold text-primary transition-colors active:bg-primary/15"
                                                            >
                                                                {item.harga_mode === 'total' ? 'ganti satuan' : 'ganti total'}
                                                            </button>
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            placeholder="0"
                                                            value={
                                                                item.harga_mode === 'total'
                                                                    ? item.harga_total
                                                                    : item.harga_satuan
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    item.harga_mode === 'total'
                                                                        ? 'harga_total'
                                                                        : 'harga_satuan',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                        <p className="mt-1 text-[10px] leading-none text-muted-foreground">
                                                            {item.harga_mode === 'total'
                                                                ? `dibagi ${masukStok || 0} ${satuan} = ${formatRupiah(effectiveHargaSatuan(item))}/satuan`
                                                                : 'boleh desimal'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-right text-sm font-bold">
                                                    {formatRupiah(calculateSubtotal(item))}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
                                    <span className="text-sm font-semibold text-muted-foreground">
                                        Total Pembelian:
                                    </span>
                                    <span className="text-base font-bold">
                                        {formatRupiah(calculateTotal())}
                                    </span>
                                </div>
                            </div>

                            {/* Desktop: tabel */}
                            <div className="custom-scrollbar touch-scroll hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[560px] text-sm">
                                    <thead>
                                        <tr className="border-b text-muted-foreground">
                                            <th className="pb-2 text-left font-medium">
                                                Bahan Baku
                                            </th>
                                            <th className="w-24 pb-2 text-left font-medium">
                                                Netto/Pcs
                                            </th>
                                            <th className="w-24 pb-2 text-center font-medium">
                                                Beli per Bungkus
                                            </th>
                                            <th className="w-32 pb-2 text-left font-medium">
                                                Qty
                                            </th>
                                            <th className="w-56 pb-2 text-left font-medium">
                                                Harga (Rp)
                                            </th>
                                            <th className="w-40 pb-2 text-right font-medium">
                                                Subtotal
                                            </th>
                                            <th className="w-10 pb-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {items.map((item, index) => {
                                            const bahan = bahanBakus.find(
                                                (b) =>
                                                    b.id ===
                                                    Number(item.bahan_baku_id),
                                            );
                                            const satuan = bahan?.satuan ?? '-';
                                            const masukStok =
                                                effectiveQty(item);

                                            return (
                                                <tr key={index}>
                                                    <td className="py-2 pr-2">
                                                        <Select
                                                            value={
                                                                item.bahan_baku_id
                                                            }
                                                            onValueChange={(
                                                                val,
                                                            ) =>
                                                                updateItem(
                                                                    index,
                                                                    'bahan_baku_id',
                                                                    val,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Pilih bahan baku" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {bahanBakus.map(
                                                                    (b) => (
                                                                        <SelectItem
                                                                            key={
                                                                                b.id
                                                                            }
                                                                            value={String(
                                                                                b.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                b.nama_bahan
                                                                            }{' '}
                                                                            (
                                                                            {
                                                                                b.satuan
                                                                            }
                                                                            )
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        {(form.errors as any)[
                                                            `items.${index}.bahan_baku_id`
                                                        ] && (
                                                            <p className="mt-1 text-xs text-destructive">
                                                                {
                                                                    (
                                                                        form.errors as any
                                                                    )[
                                                                        `items.${index}.bahan_baku_id`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="py-2 pr-2 text-[11px] text-muted-foreground">
                                                        {item.netto_pcs == null
                                                            ? '-'
                                                            : `${item.netto_pcs} ${bahan?.satuan ?? ''}`}
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <div className="flex items-center gap-1">
                                                            <Checkbox
                                                                checked={
                                                                    item.beli_per_bungkus
                                                                }
                                                                onCheckedChange={(
                                                                    checked: boolean,
                                                                ) =>
                                                                    toggleBeliPerBungkus(
                                                                        index,
                                                                        checked,
                                                                    )
                                                                }
                                                            />
                                                            <span className="text-[10px] leading-none text-muted-foreground">
                                                                Per Bungkus
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            placeholder="0"
                                                            value={
                                                                item.beli_per_bungkus
                                                                    ? item.qty_bungkus
                                                                    : item.qty
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    item.beli_per_bungkus
                                                                        ? 'qty_bungkus'
                                                                        : 'qty',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            aria-label={
                                                                item.beli_per_bungkus
                                                                    ? 'Qty bungkus'
                                                                    : 'Qty'
                                                            }
                                                        />
                                                        <p className="text-[10px] leading-none text-muted-foreground">
                                                            Masuk stok:{' '}
                                                            {masukStok} {satuan}
                                                        </p>
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleHargaMode(
                                                                    index,
                                                                )
                                                            }
                                                            className="mb-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold text-primary transition-colors hover:bg-primary/15"
                                                        >
                                                            {item.harga_mode === 'total'
                                                                ? 'Harga Total'
                                                                : 'Harga Satuan'}
                                                        </button>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            placeholder="0"
                                                            value={
                                                                item.harga_mode ===
                                                                'total'
                                                                    ? item.harga_total
                                                                    : item.harga_satuan
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    item.harga_mode ===
                                                                        'total'
                                                                        ? 'harga_total'
                                                                        : 'harga_satuan',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <p className="text-[10px] leading-none text-muted-foreground">
                                                            {item.harga_mode ===
                                                            'total'
                                                                ? `dibagi ${masukStok || 0} ${satuan} = ${formatRupiah(effectiveHargaSatuan(item))}/satuan`
                                                                : 'boleh desimal'}
                                                        </p>
                                                    </td>
                                                    <td className="py-2 pr-2 text-right font-medium">
                                                        {formatRupiah(
                                                            calculateSubtotal(
                                                                item,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="py-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                removeItem(
                                                                    index,
                                                                )
                                                            }
                                                            disabled={
                                                                items.length ===
                                                                1
                                                            }
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t">
                                            <td
                                                colSpan={5}
                                                className="pt-3 pr-2 text-right font-semibold text-muted-foreground"
                                            >
                                                Total Pembelian:
                                            </td>
                                            <td className="pt-3 text-right text-lg font-bold">
                                                {formatRupiah(calculateTotal())}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {(form.errors as any)['items'] && (
                                <p className="mt-2 text-xs text-destructive">
                                    {(form.errors as any)['items']}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="sticky bottom-20 z-20 flex gap-3 rounded-2xl border border-border/70 bg-background/95 p-2 shadow-lg backdrop-blur-xl md:static md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 flex-1 rounded-xl md:h-9 md:flex-initial"
                            onClick={() =>
                                router.visit(purchasesAction.index().url)
                            }
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-11 flex-[2] rounded-xl md:h-9 md:flex-initial"
                        >
                            {form.processing
                                ? 'Menyimpan...'
                                : 'Simpan Pembelian'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

PurchasesCreate.layout = {
    breadcrumbs: [
        { title: 'Transaksi Pembelian', href: purchasesAction.index() },
        { title: 'Tambah Pembelian', href: purchasesAction.create() },
    ],
};
