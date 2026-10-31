import { Head, router, useForm } from '@inertiajs/react';
import {
    Split,
    UserCheck,
    Calendar,
    Filter,
    ShieldCheck,
    Clock,
    ArrowRightLeft,
    Pencil,
    Trash2,
    X,
    Plus,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatRupiah } from '@/lib/utils';

interface Mitra {
    id: number;
    kode: string;
    nama: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

interface Balance {
    id: number;
    nama: string;
    kode: string;
    user_id?: number | null;
    email?: string | null;
    dibayar: number;
    bagian: number;
    transfer_keluar: number;
    transfer_masuk: number;
    saldo: number;
}

interface SplitTagihan {
    id: number;
    mitra_id: number;
    bagian: number;
    status: 'lunas' | 'belum_lunas';
    mitra?: Mitra;
}

interface Obligation {
    id: number;
    nama: string;
    kode: string;
}

interface Obligations {
    mitras: Obligation[];
    matrix: Record<number, Record<number, number>>;
    totalByDebtor: Record<number, number>;
    totalByCreditor: Record<number, number>;
    grandTotal: number;
}

interface Purchase {
    id: number;
    nama_pembelian: string;
    total: number;
    created_at: string;
    mitra?: Mitra;
    split_tagihans?: SplitTagihan[];
}

interface Expense {
    id: number;
    kategori: string;
    keterangan?: string | null;
    nominal: number;
    tanggal: string;
    mitra?: Mitra;
    split_tagihans?: SplitTagihan[];
}

interface Transfer {
    id: number;
    dari_mitra_id: number;
    ke_mitra_id: number;
    nominal: number | string;
    tanggal: string;
    pre_order_id?: number | null;
    keterangan?: string | null;
    dari_mitra?: Mitra | null;
    ke_mitra?: Mitra | null;
    pre_order?: { id: number; kode: string; keterangan: string } | null;
}

interface Batch {
    id: number;
    kode: string;
    keterangan: string;
    status: string;
}

interface Props {
    mitras: Mitra[];
    balances: Balance[];
    obligations: Obligations;
    purchases: Purchase[];
    expenses: Expense[];
    transfers: Transfer[];
    batches: Batch[];
    filters: {
        startDate?: string;
        endDate?: string;
        pre_order_id?: string | number | null;
    };
}

type HistoryRow = {
    key: string;
    tanggal: string;
    nama: string;
    jenis: 'Pembelian' | 'Operasional';
    mitra?: Mitra | null;
    total: number;
    splits: SplitTagihan[];
};

type TransferFormData = {
    dari_mitra_id: string;
    ke_mitra_id: string;
    nominal: string;
    tanggal: string;
    pre_order_id: string;
    keterangan: string;
};

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

const emptyTransfer = (): TransferFormData => ({
    dari_mitra_id: '',
    ke_mitra_id: '',
    nominal: '',
    tanggal: today(),
    pre_order_id: '',
    keterangan: '',
});

export default function SplitBillIndex({
    mitras,
    balances,
    obligations,
    purchases,
    expenses,
    transfers,
    batches,
    filters,
}: Props) {
    const [startDate, setStartDate] = useState(filters?.startDate || '');
    const [endDate, setEndDate] = useState(filters?.endDate || '');
    const [batchId, setBatchId] = useState(String(filters?.pre_order_id ?? ''));
    const [editing, setEditing] = useState<Transfer | null>(null);

    const form = useForm<TransferFormData>(emptyTransfer());

    const history: HistoryRow[] = [
        ...purchases.map(
            (p): HistoryRow => ({
                key: `pembelian-${p.id}`,
                tanggal: p.created_at,
                nama: p.nama_pembelian,
                jenis: 'Pembelian',
                mitra: p.mitra,
                total: Number(p.total),
                splits: p.split_tagihans ?? [],
            }),
        ),
        ...(expenses ?? []).map(
            (e): HistoryRow => ({
                key: `operasional-${e.id}`,
                tanggal: e.tanggal,
                nama: `${e.kategori}${e.keterangan ? ` — ${e.keterangan}` : ''}`,
                jenis: 'Operasional',
                mitra: e.mitra,
                total: Number(e.nominal),
                splits: e.split_tagihans ?? [],
            }),
        ),
    ].sort(
        (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
    );

    const buildFilterQuery = () => {
        const data: Record<string, string> = {};

        if (startDate) {
            data.start_date = startDate;
        }

        if (endDate) {
            data.end_date = endDate;
        }

        if (batchId) {
            data.pre_order_id = batchId;
        }

        return data;
    };

    const handleApplyFilter = () => {
        router.visit('/split-bills', {
            data: buildFilterQuery(),
            preserveState: true,
        });
    };

    const handleResetFilter = () => {
        setStartDate('');
        setEndDate('');
        setBatchId('');
        router.visit('/split-bills', {
            preserveState: true,
        });
    };

    const handleSettle = (tagihanId: number) => {
        router.post(`/split-bills/${tagihanId}/settle`);
    };

    const resetTransferForm = () => {
        setEditing(null);
        form.setData(emptyTransfer());
        form.clearErrors();
    };

    const startEditTransfer = (transfer: Transfer) => {
        setEditing(transfer);
        form.setData({
            dari_mitra_id: String(transfer.dari_mitra_id),
            ke_mitra_id: String(transfer.ke_mitra_id),
            nominal: String(Number(transfer.nominal)),
            tanggal: transfer.tanggal?.slice(0, 10) ?? today(),
            pre_order_id: transfer.pre_order_id
                ? String(transfer.pre_order_id)
                : '',
            keterangan: transfer.keterangan ?? '',
        });
        form.clearErrors();
    };

    const submitTransfer = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editing) {
            form.put(`/split-bills/transfers/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => resetTransferForm(),
            });
        } else {
            form.post('/split-bills/transfers', {
                preserveScroll: true,
                onSuccess: () => resetTransferForm(),
            });
        }
    };

    const deleteTransfer = (transfer: Transfer) => {
        router.delete(`/split-bills/transfers/${transfer.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (editing?.id === transfer.id) {
                    resetTransferForm();
                }
            },
        });
    };

    return (
        <>
            <Head title="Split Bill Partner & Monitoring Akun" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                            <Split className="h-6 w-6 text-primary" />
                            Monitoring Keuangan Akun Partner (Split Bill)
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Pencatatan talangan belanja, pembagian proporsi,
                            pembayaran antar partner, dan status saldo per akun
                            partner.
                        </p>
                    </div>

                    {/* Filter Rentang Waktu & Batch */}
                    <div className="flex w-full flex-col flex-wrap items-stretch gap-2 rounded-2xl border bg-muted/40 p-2.5 sm:flex-row sm:items-center lg:w-auto">
                        <div className="flex w-full items-center gap-2 sm:w-auto">
                            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="grid flex-1 grid-cols-2 gap-1.5">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className="h-9 w-full rounded-lg text-xs"
                                    aria-label="Tanggal mulai filter"
                                />
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-9 w-full rounded-lg text-xs"
                                    aria-label="Tanggal akhir filter"
                                />
                            </div>
                        </div>
                        <div className="flex w-full items-center gap-2 sm:w-auto">
                            <select
                                value={batchId}
                                onChange={(e) => setBatchId(e.target.value)}
                                aria-label="Filter batch"
                                className="h-9 flex-1 rounded-xl border border-input bg-card px-2.5 text-xs sm:w-44"
                            >
                                <option value="">Semua batch</option>
                                {batches.map((batch) => (
                                    <option key={batch.id} value={batch.id}>
                                        {batch.kode} — {batch.keterangan}
                                    </option>
                                ))}
                            </select>
                            <Button
                                size="sm"
                                onClick={handleApplyFilter}
                                className="flex h-9 items-center justify-center gap-1 rounded-xl px-3 text-xs"
                            >
                                <Filter className="h-3.5 w-3.5" /> Filter
                            </Button>
                            {(startDate || endDate || batchId) && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleResetFilter}
                                    className="h-9 rounded-xl px-2.5 text-xs"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3 KARTU HARD AKUN PARTNER DI LAYAR */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {balances.map((b) => {
                        const isSurplus = b.saldo >= 0;

                        return (
                            <Card
                                key={b.id}
                                className="overflow-hidden border-2 shadow-sm"
                            >
                                <CardHeader className="bg-muted/30 pb-3">
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant="outline"
                                            className="text-sm font-bold"
                                        >
                                            Partner {b.kode}
                                        </Badge>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <UserCheck className="h-3.5 w-3.5 text-primary" />
                                            {b.email ||
                                                `partner.${b.kode.toLowerCase()}@gabinbite.pwt`}
                                        </span>
                                    </div>
                                    <CardTitle className="mt-2 text-lg">
                                        {b.nama}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-4">
                                    <div className="flex justify-between border-b pb-2 text-xs">
                                        <span className="text-muted-foreground">
                                            Total Belanja Ditalangi:
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {formatRupiah(b.dibayar)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2 text-xs">
                                        <span className="text-muted-foreground">
                                            Kewajiban Patungan (1/3):
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {formatRupiah(b.bagian)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2 text-xs">
                                        <span className="text-muted-foreground">
                                            Sudah Dibayarkan ke Partner:
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {formatRupiah(b.transfer_keluar)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2 text-xs">
                                        <span className="text-muted-foreground">
                                            Diterima dari Partner:
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {formatRupiah(b.transfer_masuk)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs font-bold uppercase">
                                            Status Saldo:
                                        </span>
                                        <div className="text-right">
                                            <span
                                                className={`text-base font-extrabold ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                                            >
                                                {isSurplus
                                                    ? `+${formatRupiah(b.saldo)}`
                                                    : formatRupiah(b.saldo)}
                                            </span>
                                            <p className="text-[10px] text-muted-foreground">
                                                {isSurplus
                                                    ? 'Hak terima pergantian'
                                                    : 'Wajib mengganti talangan'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* DETAIL TUNGGAKAN PER PASANGAN MEMBER */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <UserCheck className="h-4 w-4 shrink-0 text-primary" />
                            Detail Tunggakan per Pasangan Member
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-xs text-muted-foreground">
                            Berdasarkan split tagihan yang belum lunas, ini
                            adalah total yang{'\n'}
                            harus dibayar setiap member kepada member lain.
                            Contoh: Fahmi ke Nalwa berapa, serta Fahmi ke Widya
                            berapa.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-xs text-muted-foreground uppercase">
                                        <th className="pb-3 text-left font-medium">
                                            Yang Utang
                                        </th>
                                        {obligations.mitras.map((m) => (
                                            <th
                                                key={m.id}
                                                className="pb-3 text-right font-medium"
                                            >
                                                Ke {m.kode} ({m.nama})
                                            </th>
                                        ))}
                                        <th className="w-32 pb-3 text-right font-medium">
                                            Total Harus Dibayar
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-xs">
                                    {obligations.mitras.map((debtor) => {
                                        const row =
                                            obligations.matrix[debtor.id] ?? {};

                                        return (
                                            <tr
                                                key={debtor.id}
                                                className="hover:bg-muted/10"
                                            >
                                                <td className="py-3 font-semibold text-foreground">
                                                    {debtor.kode} —{' '}
                                                    {debtor.nama}
                                                </td>
                                                {obligations.mitras.map(
                                                    (creditor) => (
                                                        <td
                                                            key={creditor.id}
                                                            className="py-3 text-right"
                                                        >
                                                            {debtor.id ===
                                                            creditor.id ? (
                                                                <span className="text-muted-foreground">
                                                                    —
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    {formatRupiah(
                                                                        row[
                                                                            creditor
                                                                                .id
                                                                        ] ?? 0,
                                                                    )}
                                                                </>
                                                            )}
                                                        </td>
                                                    ),
                                                )}
                                                <td className="py-3 text-right font-semibold">
                                                    {formatRupiah(
                                                        obligations
                                                            .totalByDebtor[
                                                            debtor.id
                                                        ] ?? 0,
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="border-t bg-muted/50 font-semibold">
                                        <td className="py-3 text-left">
                                            Total Harus Diterima
                                        </td>
                                        {obligations.mitras.map((creditor) => (
                                            <td
                                                key={creditor.id}
                                                className="py-3 text-right"
                                            >
                                                {formatRupiah(
                                                    obligations.totalByCreditor[
                                                        creditor.id
                                                    ] ?? 0,
                                                )}
                                            </td>
                                        ))}
                                        <td className="py-3 text-right">
                                            {formatRupiah(
                                                obligations.grandTotal,
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {obligations.grandTotal === 0 && (
                            <p className="mt-3 text-center text-xs text-muted-foreground">
                                Tidak ada tunggakan split bill yang belum lunas
                                saat ini.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* FORM PEMBAYARAN ANTAR PARTNER */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-2 text-base font-semibold">
                            <span className="flex items-center gap-2">
                                <ArrowRightLeft className="h-4 w-4 text-primary" />
                                {editing
                                    ? 'Edit Pembayaran Antar Partner'
                                    : 'Catat Pembayaran Antar Partner'}
                            </span>
                            {editing && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetTransferForm}
                                >
                                    <X className="mr-1 h-4 w-4" /> Batal Edit
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitTransfer}
                            className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
                        >
                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">
                                    Dari Partner (yang membayar)
                                </label>
                                <select
                                    value={form.data.dari_mitra_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'dari_mitra_id',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                    aria-label="Dari partner"
                                >
                                    <option value="">
                                        Pilih partner pembayar
                                    </option>
                                    {mitras.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.kode} — {m.nama}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.dari_mitra_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.dari_mitra_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">
                                    Ke Partner (yang menerima)
                                </label>
                                <select
                                    value={form.data.ke_mitra_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'ke_mitra_id',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                    aria-label="Ke partner"
                                >
                                    <option value="">
                                        Pilih partner penerima
                                    </option>
                                    {mitras.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.kode} — {m.nama}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.ke_mitra_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.ke_mitra_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">
                                    Nominal
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.nominal}
                                    onChange={(e) =>
                                        form.setData('nominal', e.target.value)
                                    }
                                    placeholder="0"
                                    aria-label="Nominal pembayaran"
                                />
                                {form.errors.nominal && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.nominal}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">
                                    Tanggal Pembayaran
                                </label>
                                <Input
                                    type="date"
                                    value={form.data.tanggal}
                                    onChange={(e) =>
                                        form.setData('tanggal', e.target.value)
                                    }
                                    aria-label="Tanggal pembayaran"
                                />
                                {form.errors.tanggal && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.tanggal}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">
                                    Batch (opsional)
                                </label>
                                <select
                                    value={form.data.pre_order_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'pre_order_id',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                    aria-label="Batch pembayaran"
                                >
                                    <option value="">
                                        Tanpa batch / semua
                                    </option>
                                    {batches.map((batch) => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.kode} — {batch.keterangan}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.pre_order_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.pre_order_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">
                                    Keterangan (opsional)
                                </label>
                                <Input
                                    value={form.data.keterangan}
                                    onChange={(e) =>
                                        form.setData(
                                            'keterangan',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: pelunasan talangan batch 1"
                                    aria-label="Keterangan pembayaran"
                                />
                                {form.errors.keterangan && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.keterangan}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-end md:col-span-2 lg:col-span-3">
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {editing ? (
                                        <>
                                            <Pencil className="mr-2 h-4 w-4" />{' '}
                                            Simpan Perubahan
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 h-4 w-4" />{' '}
                                            Simpan Pembayaran
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* RIWAYAT PEMBAYARAN ANTAR PARTNER */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Riwayat Pembayaran Antar Partner
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-xs text-muted-foreground uppercase">
                                        <th className="pb-3 text-left font-medium">
                                            Tanggal
                                        </th>
                                        <th className="pb-3 text-left font-medium">
                                            Dari
                                        </th>
                                        <th className="pb-3 text-left font-medium">
                                            Ke
                                        </th>
                                        <th className="pb-3 text-right font-medium">
                                            Nominal
                                        </th>
                                        <th className="pb-3 pl-4 text-left font-medium">
                                            Batch
                                        </th>
                                        <th className="pb-3 pl-4 text-left font-medium">
                                            Keterangan
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-xs">
                                    {transfers.length > 0 ? (
                                        transfers.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="hover:bg-muted/10"
                                            >
                                                <td className="py-3 text-muted-foreground">
                                                    {new Date(
                                                        t.tanggal,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        },
                                                    )}
                                                </td>
                                                <td className="py-3">
                                                    <Badge variant="secondary">
                                                        {t.dari_mitra
                                                            ? `${t.dari_mitra.kode} (${t.dari_mitra.nama})`
                                                            : `Mitra #${t.dari_mitra_id}`}
                                                    </Badge>
                                                </td>
                                                <td className="py-3">
                                                    <Badge variant="outline">
                                                        {t.ke_mitra
                                                            ? `${t.ke_mitra.kode} (${t.ke_mitra.nama})`
                                                            : `Mitra #${t.ke_mitra_id}`}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 text-right font-bold">
                                                    {formatRupiah(
                                                        Number(t.nominal),
                                                    )}
                                                </td>
                                                <td className="py-3 pl-4 text-muted-foreground">
                                                    {t.pre_order
                                                        ? `${t.pre_order.kode} — ${t.pre_order.keterangan}`
                                                        : '-'}
                                                </td>
                                                <td className="py-3 pl-4 text-muted-foreground">
                                                    {t.keterangan || '-'}
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex justify-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            title="Edit pembayaran"
                                                            onClick={() =>
                                                                startEditTransfer(
                                                                    t,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    title="Hapus pembayaran"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        Hapus
                                                                        catatan
                                                                        pembayaran?
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Pembayaran{' '}
                                                                        {t
                                                                            .dari_mitra
                                                                            ?.kode ??
                                                                            `#${t.dari_mitra_id}`}{' '}
                                                                        ke{' '}
                                                                        {t
                                                                            .ke_mitra
                                                                            ?.kode ??
                                                                            `#${t.ke_mitra_id}`}{' '}
                                                                        sebesar{' '}
                                                                        {formatRupiah(
                                                                            Number(
                                                                                t.nominal,
                                                                            ),
                                                                        )}{' '}
                                                                        akan
                                                                        dihapus
                                                                        dan
                                                                        saldo
                                                                        partner
                                                                        dihitung
                                                                        ulang.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>
                                                                        Batal
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                        onClick={() =>
                                                                            deleteTransfer(
                                                                                t,
                                                                            )
                                                                        }
                                                                    >
                                                                        Hapus
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-6 text-center text-muted-foreground"
                                            >
                                                Belum ada pembayaran antar
                                                partner yang dicatat.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* TABEL HISTORI TRANSAKSI BELANJA & SPLIT TAGIHAN */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Riwayat Belanja & Operasional yang Dibagi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-xs text-muted-foreground uppercase">
                                        <th className="pb-3 text-left font-medium">
                                            Tanggal
                                        </th>
                                        <th className="pb-3 text-left font-medium">
                                            Jenis
                                        </th>
                                        <th className="pb-3 text-left font-medium">
                                            Keterangan
                                        </th>
                                        <th className="pb-3 text-left font-medium">
                                            Ditalangi Oleh
                                        </th>
                                        <th className="pb-3 text-right font-medium">
                                            Total
                                        </th>
                                        <th className="pb-3 pl-6 text-left font-medium">
                                            Rincian Split Tagihan (Partner)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-xs">
                                    {history.length > 0 ? (
                                        history.map((row) => (
                                            <tr
                                                key={row.key}
                                                className="hover:bg-muted/10"
                                            >
                                                <td className="py-3 text-muted-foreground">
                                                    {new Date(
                                                        row.tanggal,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        },
                                                    )}
                                                </td>
                                                <td className="py-3">
                                                    <Badge
                                                        variant={
                                                            row.jenis ===
                                                            'Pembelian'
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {row.jenis}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 font-semibold text-foreground">
                                                    {row.nama}
                                                </td>
                                                <td className="py-3">
                                                    <Badge variant="secondary">
                                                        {row.mitra
                                                            ? `${row.mitra.kode} (${row.mitra.nama})`
                                                            : 'Kas Bersama'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 text-right font-bold">
                                                    {formatRupiah(row.total)}
                                                </td>
                                                <td className="py-3 pl-6">
                                                    <div className="flex flex-wrap gap-2">
                                                        {row.splits.map(
                                                            (st) => (
                                                                <div
                                                                    key={st.id}
                                                                    className={`flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] ${
                                                                        st.status ===
                                                                        'lunas'
                                                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                                            : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                                                    }`}
                                                                >
                                                                    <span>
                                                                        {
                                                                            st
                                                                                .mitra
                                                                                ?.kode
                                                                        }
                                                                        :{' '}
                                                                        {formatRupiah(
                                                                            st.bagian,
                                                                        )}
                                                                    </span>
                                                                    {st.status ===
                                                                    'lunas' ? (
                                                                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-5 px-1 text-[10px] hover:bg-amber-500/20"
                                                                            onClick={() =>
                                                                                handleSettle(
                                                                                    st.id,
                                                                                )
                                                                            }
                                                                            title="Tandai bagian ini lunas"
                                                                        >
                                                                            <Clock className="mr-0.5 h-2.5 w-2.5" />{' '}
                                                                            Ganti
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-6 text-center text-muted-foreground"
                                            >
                                                Belum ada transaksi
                                                belanja/operasional yang dibagi
                                                split bill.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SplitBillIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Split Bill Partner', href: '/split-bills' },
    ],
};
