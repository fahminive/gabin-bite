import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

type Batch = {
    id: number;
    kode: string;
    keterangan: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: 'buka' | 'tutup' | 'selesai';
    pembelians_count?: number;
    penjualans_count?: number;
    penjualans_sum_total?: number | null;
    pembelians_sum_total?: number | null;
};

type FormData = {
    kode: string;
    keterangan: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: 'buka' | 'tutup' | 'selesai';
};

const emptyForm = (kode: string): FormData => ({
    kode,
    keterangan: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    status: 'buka',
});

const statusLabel: Record<string, string> = {
    buka: 'Aktif / Buka',
    tutup: 'Ditutup',
    selesai: 'Selesai',
};

const statusVariant = (status: string) => {
    if (status === 'buka') return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (status === 'tutup') return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-slate-100 text-slate-700 border-slate-300';
};

export default function PreOrderIndex({ batches, defaultKode }: { batches: Batch[]; defaultKode: string }) {
    const [editing, setEditing] = useState<Batch | null>(null);
    const form = useForm<FormData>(emptyForm(defaultKode));

    function resetForm() {
        setEditing(null);
        form.setData(emptyForm(defaultKode));
        form.clearErrors();
    }

    function startEdit(batch: Batch) {
        setEditing(batch);
        form.setData({
            kode: batch.kode,
            keterangan: batch.keterangan,
            tanggal_mulai: batch.tanggal_mulai?.slice(0, 10) ?? '',
            tanggal_selesai: batch.tanggal_selesai?.slice(0, 10) ?? '',
            status: batch.status,
        });
        form.clearErrors();
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (editing) {
            form.put(`/pre-orders/${editing.id}`, {
                onSuccess: () => resetForm(),
            });
        } else {
            form.post('/pre-orders', {
                onSuccess: () => form.reset('keterangan', 'tanggal_mulai', 'tanggal_selesai'),
            });
        }
    }

    return (
        <>
            <Head title="Batch Pre-Order" />
            <div className="flex h-full flex-1 flex-col gap-5 p-4 md:p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold">Batch Pre-Order</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola periode pre-order. Batch menjadi acuan pemisahan transaksi, pesanan, dan laporan.
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>{editing ? `Edit ${editing.keterangan || editing.kode}` : 'Buat Batch Baru'}</span>
                            {editing && (
                                <Button variant="ghost" size="sm" onClick={resetForm}>
                                    <X className="mr-1 h-4 w-4" /> Batal Edit
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                            <Input
                                aria-label="Kode batch"
                                value={form.data.kode}
                                onChange={e => form.setData('kode', e.target.value)}
                                placeholder="Kode batch (contoh: PO-B1)"
                            />
                            <Input
                                aria-label="Keterangan"
                                value={form.data.keterangan}
                                onChange={e => form.setData('keterangan', e.target.value)}
                                placeholder="Nama / label batch (contoh: Batch 1)"
                            />
                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">Tanggal Mulai</label>
                                <Input
                                    aria-label="Tanggal mulai"
                                    type="date"
                                    value={form.data.tanggal_mulai}
                                    onChange={e => form.setData('tanggal_mulai', e.target.value)}
                                />
                                {form.errors.tanggal_mulai && <p className="text-xs text-destructive">{form.errors.tanggal_mulai}</p>}
                            </div>
                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">Tanggal Selesai</label>
                                <Input
                                    aria-label="Tanggal selesai"
                                    type="date"
                                    value={form.data.tanggal_selesai}
                                    onChange={e => form.setData('tanggal_selesai', e.target.value)}
                                />
                                {form.errors.tanggal_selesai && <p className="text-xs text-destructive">{form.errors.tanggal_selesai}</p>}
                            </div>
                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">Status Batch</label>
                                <select
                                    aria-label="Status batch"
                                    value={form.data.status}
                                    onChange={e => form.setData('status', e.target.value as FormData['status'])}
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                >
                                    <option value="buka">Aktif / Buka</option>
                                    <option value="tutup">Ditutup (tidak menerima transaksi baru)</option>
                                    <option value="selesai">Selesai</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" disabled={form.processing} className="w-full">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {editing ? 'Simpan Perubahan' : 'Simpan Batch'}
                                </Button>
                            </div>
                            {Object.keys(form.errors).length > 0 && (
                                <p className="text-xs text-destructive md:col-span-2">
                                    {Object.values(form.errors)[0]}
                                </p>
                            )}
                        </form>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border border-border/80 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-bold">Daftar Batch</CardTitle>
                        <span className="text-xs text-muted-foreground">{batches.length} batch</span>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                        {batches.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground rounded-xl border border-dashed">
                                Belum ada batch. Buat batch pertama di form atas.
                            </div>
                        ) : (
                            <>
                                {/* Mobile Card View (Khusus Smartphone) */}
                                <div className="space-y-3 md:hidden">
                                    {batches.map(batch => (
                                        <div
                                            key={`mobile-${batch.id}`}
                                            className="rounded-2xl border border-border/80 bg-muted/15 p-4 space-y-3 shadow-xs"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-extrabold text-sm text-foreground">{batch.kode}</span>
                                                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full ${statusVariant(batch.status)}`}>
                                                            {statusLabel[batch.status] ?? batch.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                                        {batch.keterangan || 'Tanpa keterangan'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => startEdit(batch)} title="Edit batch">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm" className="h-8 w-8 p-0 rounded-lg" title="Hapus batch">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Hapus {batch.keterangan || batch.kode}?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Batch yang sudah memiliki transaksi tidak dapat dihapus. Tindakan ini tidak dapat dibatalkan.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                    onClick={() => router.delete(`/pre-orders/${batch.id}`)}
                                                                >
                                                                    Hapus
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>

                                            <div className="text-[11px] text-muted-foreground bg-card/60 p-2 rounded-xl border flex items-center justify-between">
                                                <span className="font-medium">Periode:</span>
                                                <span className="font-semibold text-foreground">
                                                    {batch.tanggal_mulai?.slice(0, 10) ?? '-'} s/d {batch.tanggal_selesai?.slice(0, 10) ?? '-'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="p-2.5 rounded-xl bg-card border">
                                                    <span className="text-[10px] text-muted-foreground block">Belanja Bahan</span>
                                                    <span className="font-bold text-foreground block">
                                                        {formatRupiah(Number(batch.pembelians_sum_total ?? 0))}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {batch.pembelians_count ?? 0} transaksi
                                                    </span>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-card border">
                                                    <span className="text-[10px] text-muted-foreground block">Pesanan Pelanggan</span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                                                        {formatRupiah(Number(batch.penjualans_sum_total ?? 0))}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {batch.penjualans_count ?? 0} pesanan
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                                                <th className="p-2">Batch</th>
                                                <th className="p-2">Periode</th>
                                                <th className="p-2">Status</th>
                                                <th className="p-2 text-right">Pembelian</th>
                                                <th className="p-2 text-right">Pesanan</th>
                                                <th className="p-2 text-right">Nilai Pesanan</th>
                                                <th className="p-2 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {batches.map(batch => (
                                                <tr key={batch.id} className="border-b align-top hover:bg-muted/30 transition-colors">
                                                    <td className="p-2">
                                                        <div className="font-semibold">{batch.kode}</div>
                                                        <div className="text-xs text-muted-foreground">{batch.keterangan}</div>
                                                    </td>
                                                    <td className="p-2 text-xs">
                                                        {batch.tanggal_mulai?.slice(0, 10) ?? '-'} s/d {batch.tanggal_selesai?.slice(0, 10) ?? '-'}
                                                    </td>
                                                    <td className="p-2">
                                                        <Badge variant="outline" className={statusVariant(batch.status)}>
                                                            {statusLabel[batch.status] ?? batch.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-2 text-right text-xs">
                                                        <div>{batch.pembelians_count ?? 0} transaksi</div>
                                                        <div className="text-muted-foreground">{formatRupiah(Number(batch.pembelians_sum_total ?? 0))}</div>
                                                    </td>
                                                    <td className="p-2 text-right text-xs">
                                                        {batch.penjualans_count ?? 0} pesanan
                                                    </td>
                                                    <td className="p-2 text-right text-xs font-medium">
                                                        {formatRupiah(Number(batch.penjualans_sum_total ?? 0))}
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="flex justify-center gap-2">
                                                            <Button variant="outline" size="icon" onClick={() => startEdit(batch)} title="Edit batch">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="destructive" size="icon" title="Hapus batch">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Hapus {batch.keterangan || batch.kode}?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Batch yang sudah memiliki transaksi tidak dapat dihapus. Tindakan ini tidak dapat dibatalkan.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                            onClick={() => router.delete(`/pre-orders/${batch.id}`)}
                                                                        >
                                                                            Hapus
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
