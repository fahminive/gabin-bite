import { Head, router, useForm } from '@inertiajs/react';
import {
    Split,
    Calendar,
    Filter,
    ArrowRightLeft,
    Pencil,
    Trash2,
    Plus,
    SlidersHorizontal,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatRupiah } from '@/lib/utils';

interface Mitra {
    id: number;
    kode: string;
    nama: string;
    email?: string | null;
}

interface Balance {
    id: number;
    nama: string;
    kode: string;
    dibayar: number;
    bagian: number;
    dana_pribadi_masuk: number;
    dana_pribadi_keluar: number;
    penyesuaian: number;
    transfer_keluar: number;
    transfer_masuk: number;
    saldo: number;
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

interface Adjustment {
    id: number;
    mitra_id: number;
    nominal: number | string;
    tanggal: string;
    pre_order_id?: number | null;
    keterangan?: string | null;
    mitra?: Mitra | null;
    pre_order?: {
        id: number;
        kode: string;
        keterangan: string;
    } | null;
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
    adjustments: Adjustment[];
    transfers: Transfer[];
    batches: Batch[];
    filters: {
        startDate?: string;
        endDate?: string;
        pre_order_id?: string | number | null;
    };
}

type AdjustmentFormData = {
    mitra_id: string;
    nominal: string;
    tanggal: string;
    pre_order_id: string;
    keterangan: string;
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

const emptyAdjustment = (): AdjustmentFormData => ({
    mitra_id: '',
    nominal: '',
    tanggal: today(),
    pre_order_id: '',
    keterangan: '',
});

const emptyTransfer = (): TransferFormData => ({
    dari_mitra_id: '',
    ke_mitra_id: '',
    nominal: '',
    tanggal: today(),
    pre_order_id: '',
    keterangan: '',
});

/** Tampilkan nilai +/- dengan tanda jelas: +Rp12.000 / -Rp5.000. */
function signedRupiah(value: number): string {
    const abs = Math.abs(value);

    return `${value < 0 ? '-' : '+'}${formatRupiah(abs)}`;
}

export default function SplitBillIndex({
    mitras,
    balances,
    obligations,
    adjustments,
    transfers,
    batches,
    filters,
}: Props) {
    const [startDate, setStartDate] = useState(filters?.startDate || '');
    const [endDate, setEndDate] = useState(filters?.endDate || '');
    const [batchId, setBatchId] = useState(String(filters?.pre_order_id ?? ''));
    const [editingAdjustment, setEditingAdjustment] = useState<Adjustment | null>(null);
    const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

    const adjForm = useForm<AdjustmentFormData>(emptyAdjustment());
    const trfForm = useForm<TransferFormData>(emptyTransfer());

    const mitraName = (id: number) => mitras.find((m) => m.id === id)?.nama ?? `#${id}`;

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

    const resetAdjustmentForm = () => {
        setEditingAdjustment(null);
        adjForm.setData(emptyAdjustment());
        adjForm.clearErrors();
    };

    const startEditAdjustment = (adjustment: Adjustment) => {
        setEditingAdjustment(adjustment);
        adjForm.setData({
            mitra_id: String(adjustment.mitra_id),
            nominal: String(Number(adjustment.nominal)),
            tanggal: adjustment.tanggal?.slice(0, 10) ?? today(),
            pre_order_id: adjustment.pre_order_id ? String(adjustment.pre_order_id) : '',
            keterangan: adjustment.keterangan ?? '',
        });
        adjForm.clearErrors();
    };

    const submitAdjustment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingAdjustment) {
            adjForm.put(`/split-bills/adjustments/${editingAdjustment.id}`, {
                preserveScroll: true,
                onSuccess: () => resetAdjustmentForm(),
            });
        } else {
            adjForm.post('/split-bills/adjustments', {
                preserveScroll: true,
                onSuccess: () => resetAdjustmentForm(),
            });
        }
    };

    const deleteAdjustment = (adjustment: Adjustment) => {
        router.delete(`/split-bills/adjustments/${adjustment.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (editingAdjustment?.id === adjustment.id) {
                    resetAdjustmentForm();
                }
            },
        });
    };

    const resetTransferForm = () => {
        setEditingTransfer(null);
        trfForm.setData(emptyTransfer());
        trfForm.clearErrors();
    };

    const startEditTransfer = (transfer: Transfer) => {
        setEditingTransfer(transfer);
        trfForm.setData({
            dari_mitra_id: String(transfer.dari_mitra_id),
            ke_mitra_id: String(transfer.ke_mitra_id),
            nominal: String(Math.abs(Number(transfer.nominal))),
            tanggal: transfer.tanggal?.slice(0, 10) ?? today(),
            pre_order_id: transfer.pre_order_id ? String(transfer.pre_order_id) : '',
            keterangan: transfer.keterangan ?? '',
        });
        trfForm.clearErrors();
    };

    const submitTransfer = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingTransfer) {
            trfForm.put(`/split-bills/transfers/${editingTransfer.id}`, {
                preserveScroll: true,
                onSuccess: () => resetTransferForm(),
            });
        } else {
            trfForm.post('/split-bills/transfers', {
                preserveScroll: true,
                onSuccess: () => resetTransferForm(),
            });
        }
    };

    const deleteTransfer = (transfer: Transfer) => {
        router.delete(`/split-bills/transfers/${transfer.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (editingTransfer?.id === transfer.id) {
                    resetTransferForm();
                }
            },
        });
    };

    return (
        <>
            <Head title="Patungan Partner" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 sm:gap-6 md:p-6">
                {/* Filter */}
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                            <Filter className="h-4 w-4 text-primary" />
                            Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Dari tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Sampai tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Batch Pre-Order
                                </label>
                                <Select value={batchId || 'all'} onValueChange={(v) => setBatchId(v === 'all' ? '' : v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua batch</SelectItem>
                                        {batches.map((batch) => (
                                            <SelectItem key={batch.id} value={String(batch.id)}>
                                                {batch.kode} - {batch.keterangan}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button size="sm" onClick={handleApplyFilter}>
                                    Terapkan
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleResetFilter}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Saldo per partner */}
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                            <Split className="h-4 w-4 text-primary" />
                            Saldo Partner
                            <span className="text-xs font-normal text-muted-foreground">
                                uang yang ditangani dikurangi bagian patungan,
                                plus dana pribadi, penyesuaian, dan transfer
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground">
                                        <th className="pb-2 pr-3 font-semibold">Partner</th>
                                        <th className="pb-2 pr-3 font-semibold">Ditalangi</th>
                                        <th className="pb-2 pr-3 font-semibold">Bagian Patungan</th>
                                        <th className="pb-2 pr-3 font-semibold">Dana Pribadi</th>
                                        <th className="pb-2 pr-3 font-semibold">Penyesuaian</th>
                                        <th className="pb-2 pr-3 font-semibold">Transfer</th>
                                        <th className="pb-2 pr-3 font-semibold">Saldo</th>
                                        <th className="pb-2 font-semibold text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {balances.map((balance) => {
                                        const danaPribadi =
                                            Number(balance.dana_pribadi_masuk) -
                                            Number(balance.dana_pribadi_keluar);
                                        const transfer =
                                            Number(balance.transfer_masuk) -
                                            Number(balance.transfer_keluar);

                                        return (
                                            <tr key={balance.id}>
                                                <td className="py-2.5 pr-3 font-medium">
                                                    {balance.nama}
                                                    <span className="ml-1.5 text-xs text-muted-foreground">
                                                        {balance.kode}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 pr-3">
                                                    {formatRupiah(Number(balance.dibayar))}
                                                </td>
                                                <td className="py-2.5 pr-3 text-red-600 dark:text-red-400">
                                                    {formatRupiah(Number(balance.bagian))}
                                                </td>
                                                <td className="py-2.5 pr-3">
                                                    {danaPribadi !== 0
                                                        ? signedRupiah(danaPribadi)
                                                        : <span className="text-muted-foreground">0</span>}
                                                </td>
                                                <td className="py-2.5 pr-3">
                                                    {Number(balance.penyesuaian) !== 0
                                                        ? signedRupiah(Number(balance.penyesuaian))
                                                        : <span className="text-muted-foreground">0</span>}
                                                </td>
                                                <td className="py-2.5 pr-3">
                                                    {transfer !== 0
                                                        ? signedRupiah(transfer)
                                                        : <span className="text-muted-foreground">0</span>}
                                                </td>
                                                <td className="py-2.5 pr-3 font-semibold">
                                                    <Badge
                                                        variant={
                                                            balance.saldo === 0
                                                                ? 'secondary'
                                                                : balance.saldo > 0
                                                                    ? 'outline'
                                                                    : 'destructive'
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {formatRupiah(Number(balance.saldo))}
                                                    </Badge>
                                                    <span className="ml-1.5 text-[10px] text-muted-foreground">
                                                        {balance.saldo > 0 ? 'patungan utang ke dia' : balance.saldo < 0 ? 'dia utang patungan' : ''} 
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            resetAdjustmentForm();
                                                            adjForm.setData('mitra_id', String(balance.id));
                                                            document
                                                                .getElementById('penyesuaian')
                                                                ?.scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                    >
                                                        <Plus className="mr-1 h-3.5 w-3.5" />
                                                        Penyesuaian
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Saldo positif berarti sumbangan partner lebih dari bagiannya
                            (patungan berutang ke dia). Saldo negatif berarti bagian patungan
                            partner melebihi yang ia keluarkan (dia harus menyetor).
                        </p>
                    </CardContent>
                </Card>

                {/* Penyesuaian manual */}
                <Card id="penyesuaian" className="rounded-2xl border border-border/80 shadow-xs scroll-mt-24">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                            <SlidersHorizontal className="h-4 w-4 text-primary" />
                            Penyesuaian Manual
                            <span className="text-xs font-normal text-muted-foreground">
                                logika seperti penyesuaian stok: tambah (+) untuk
                                pengeluaran yang belum tercatat, kurangi (-) untuk
                                pemasukan/potongan
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                        <form
                            onSubmit={submitAdjustment}
                            className="grid gap-3 rounded-xl border bg-muted/30 p-3 sm:grid-cols-6"
                        >
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Partner
                                </label>
                                <Select
                                    value={adjForm.data.mitra_id}
                                    onValueChange={(v) => adjForm.setData('mitra_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih partner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mitras.map((mitra) => (
                                            <SelectItem key={mitra.id} value={String(mitra.id)}>
                                                {mitra.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {adjForm.errors.mitra_id && (
                                    <p className="mt-1 text-xs text-red-600">{adjForm.errors.mitra_id}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Nominal (boleh minus)
                                </label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={adjForm.data.nominal}
                                    onChange={(e) => adjForm.setData('nominal', e.target.value)}
                                    placeholder="+25000 / -5000"
                                />
                                {adjForm.errors.nominal && (
                                    <p className="mt-1 text-xs text-red-600">{adjForm.errors.nominal}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={adjForm.data.tanggal}
                                    onChange={(e) => adjForm.setData('tanggal', e.target.value)}
                                />
                                {adjForm.errors.tanggal && (
                                    <p className="mt-1 text-xs text-red-600">{adjForm.errors.tanggal}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Batch (opsional)
                                </label>
                                <Select
                                    value={adjForm.data.pre_order_id || 'none'}
                                    onValueChange={(v) => adjForm.setData('pre_order_id', v === 'none' ? '' : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tanpa batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Tanpa batch</SelectItem>
                                        {batches.map((batch) => (
                                            <SelectItem key={batch.id} value={String(batch.id)}>
                                                {batch.kode}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Keterangan
                                </label>
                                <Input
                                    value={adjForm.data.keterangan}
                                    onChange={(e) => adjForm.setData('keterangan', e.target.value)}
                                    placeholder="misal bensin ambil bahan"
                                />
                            </div>
                            <div className="flex items-end gap-2 sm:col-span-6">
                                <Button size="sm" disabled={adjForm.processing}>
                                    {editingAdjustment ? `Simpan untuk ${mitraName(Number(editingAdjustment.mitra_id))}` : 'Tambah Penyesuaian'}
                                </Button>
                                {editingAdjustment && (
                                    <Button size="sm" variant="outline" type="button" onClick={resetAdjustmentForm}>
                                        Batal
                                    </Button>
                                )}
                                {editingAdjustment && Number(editingAdjustment.nominal) < 0 && (
                                    <span className="pb-1 text-xs text-muted-foreground">
                                        penyesuaian ini minus (potongan);
                                        saat diedit tetap minus kecuali
                                        nominalnya diubah
                                    </span>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[560px] text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground">
                                        <th className="px-4 py-2 font-semibold">Tanggal</th>
                                        <th className="px-4 py-2 font-semibold">Partner</th>
                                        <th className="px-4 py-2 font-semibold">Nominal</th>
                                        <th className="px-4 py-2 font-semibold">Batch</th>
                                        <th className="px-4 py-2 font-semibold">Keterangan</th>
                                        <th className="px-4 py-2 text-right font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {adjustments.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                                                Belum ada penyesuaian manual.
                                            </td>
                                        </tr>
                                    )}
                                    {adjustments.map((adjustment) => (
                                        <tr key={adjustment.id}>
                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                {adjustment.tanggal?.slice(0, 10)}
                                            </td>
                                            <td className="px-4 py-2.5">{adjustment.mitra?.nama ?? mitraName(adjustment.mitra_id)}</td>
                                            <td className="px-4 py-2.5 font-semibold">
                                                <span
                                                    className={
                                                        Number(adjustment.nominal) > 0
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                    }
                                                >
                                                    {signedRupiah(Number(adjustment.nominal))}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5">{adjustment.pre_order?.kode ?? '-'}</td>
                                            <td className="px-4 py-2.5">{adjustment.keterangan || '-'}</td>
                                            <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => startEditAdjustment(adjustment)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="ghost">
                                                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Hapus penyesuaian ini?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {signedRupiah(Number(adjustment.nominal))} untuk
                                                                {' '}{adjustment.mitra?.nama ?? mitraName(adjustment.mitra_id)}
                                                                {' '}akan dihapus dan saldo partner dihitung ulang.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteAdjustment(adjustment)}>
                                                                Hapus
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Matriks tunggakan */}
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                            <Calendar className="h-4 w-4 text-primary" />
                            Matriks Tunggakan
                            <span className="text-xs font-normal text-muted-foreground">
                                baris = yang harus bayar, kolom = yang menerima
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[480px] text-sm">
                                <thead>
                                    <tr>
                                        <th className="pb-2 text-left text-xs font-semibold text-muted-foreground">
                                            Bayar ke
                                        </th>
                                        {obligations.mitras.map((creditor) => (
                                            <th key={creditor.id} className="pb-2 px-2 text-xs font-semibold text-muted-foreground">
                                                {creditor.nama}
                                            </th>
                                        ))}
                                        <th className="pb-2 px-2 text-xs font-semibold text-muted-foreground">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {obligations.mitras.map((debtor) => (
                                        <tr key={debtor.id}>
                                            <td className="py-2 pr-2 font-medium">{debtor.nama}</td>
                                            {obligations.mitras.map((creditor) => {
                                                const value =
                                                    obligations.matrix[debtor.id]?.[creditor.id] ?? 0;
                                                return (
                                                    <td key={creditor.id} className="py-2 px-2 text-center">
                                                        {debtor.id === creditor.id ? (
                                                            <span className="text-muted-foreground">-</span>
                                                        ) : value > 0 ? (
                                                            <Badge variant="outline" className="text-xs">
                                                                {formatRupiah(value)}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="py-2 px-2 text-right font-semibold">
                                                {formatRupiah(obligations.totalByDebtor[debtor.id] ?? 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-2 text-xs font-semibold">
                            Total tunggakan: {formatRupiah(obligations.grandTotal)}
                        </p>
                    </CardContent>
                </Card>

                {/* Transfer antar partner */}
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                            <ArrowRightLeft className="h-4 w-4 text-primary" />
                            Transfer Antar Partner
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                        <form
                            onSubmit={submitTransfer}
                            className="grid gap-3 rounded-xl border bg-muted/30 p-3 sm:grid-cols-6"
                        >
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Dari partner
                                </label>
                                <Select
                                    value={trfForm.data.dari_mitra_id}
                                    onValueChange={(v) => trfForm.setData('dari_mitra_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih pembayar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mitras.map((mitra) => (
                                            <SelectItem key={mitra.id} value={String(mitra.id)}>
                                                {mitra.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {trfForm.errors.dari_mitra_id && (
                                    <p className="mt-1 text-xs text-red-600">{trfForm.errors.dari_mitra_id}</p>
                                )}
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Ke partner
                                </label>
                                <Select
                                    value={trfForm.data.ke_mitra_id}
                                    onValueChange={(v) => trfForm.setData('ke_mitra_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih penerima" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mitras.map((mitra) => (
                                            <SelectItem key={mitra.id} value={String(mitra.id)}>
                                                {mitra.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {trfForm.errors.ke_mitra_id && (
                                    <p className="mt-1 text-xs text-red-600">{trfForm.errors.ke_mitra_id}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Nominal
                                </label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={trfForm.data.nominal}
                                    onChange={(e) => trfForm.setData('nominal', e.target.value)}
                                />
                                {trfForm.errors.nominal && (
                                    <p className="mt-1 text-xs text-red-600">{trfForm.errors.nominal}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Tanggal
                                </label>
                                <Input
                                    type="date"
                                    value={trfForm.data.tanggal}
                                    onChange={(e) => trfForm.setData('tanggal', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Batch
                                </label>
                                <Select
                                    value={trfForm.data.pre_order_id || 'none'}
                                    onValueChange={(v) => trfForm.setData('pre_order_id', v === 'none' ? '' : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tanpa batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Tanpa batch</SelectItem>
                                        {batches.map((batch) => (
                                            <SelectItem key={batch.id} value={String(batch.id)}>
                                                {batch.kode}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                    Keterangan
                                </label>
                                <Input
                                    value={trfForm.data.keterangan}
                                    onChange={(e) => trfForm.setData('keterangan', e.target.value)}
                                />
                            </div>
                            <div className="flex items-end gap-2 sm:col-span-6">
                                <Button size="sm" disabled={trfForm.processing}>
                                    {editingTransfer ? 'Simpan Perubahan' : 'Catat Transfer'}
                                </Button>
                                {editingTransfer && (
                                    <Button size="sm" variant="outline" type="button" onClick={resetTransferForm}>
                                        Batal
                                    </Button>
                                )}
                            </div>
                        </form>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[560px] text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground">
                                        <th className="py-2 pr-3 font-semibold">Tanggal</th>
                                        <th className="py-2 pr-3 font-semibold">Dari</th>
                                        <th className="py-2 pr-3 font-semibold">Ke</th>
                                        <th className="py-2 pr-3 font-semibold">Nominal</th>
                                        <th className="py-2 pr-3 font-semibold">Batch</th>
                                        <th className="py-2 pr-3 font-semibold">Keterangan</th>
                                        <th className="py-2 text-right font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {transfers.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-6 text-center text-muted-foreground">
                                                Belum ada transfer antar partner.
                                            </td>
                                        </tr>
                                    )}
                                    {transfers.map((transfer) => (
                                        <tr key={transfer.id}>
                                            <td className="py-2.5 pr-3 whitespace-nowrap">
                                                {transfer.tanggal?.slice(0, 10)}
                                            </td>
                                            <td className="py-2.5 pr-3">{transfer.dari_mitra?.nama ?? transfer.dari_mitra_id}</td>
                                            <td className="py-2.5 pr-3">{transfer.ke_mitra?.nama ?? transfer.ke_mitra_id}</td>
                                            <td className="py-2.5 pr-3 font-semibold">{formatRupiah(Number(transfer.nominal))}</td>
                                            <td className="py-2.5 pr-3">{transfer.pre_order?.kode ?? '-'}</td>
                                            <td className="py-2.5 pr-3">{transfer.keterangan || '-'}</td>
                                            <td className="py-2.5 text-right whitespace-nowrap">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => startEditTransfer(transfer)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="ghost">
                                                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Hapus transfer ini?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Transfer {formatRupiah(Number(transfer.nominal))} dari
                                                                {' '}{transfer.dari_mitra?.nama} ke
                                                                {' '}{transfer.ke_mitra?.nama} akan dihapus.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteTransfer(transfer)}>
                                                                Hapus
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
