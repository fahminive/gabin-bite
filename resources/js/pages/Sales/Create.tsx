import { Head } from '@inertiajs/react';
import { useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
} from '@/components/ui/field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ShoppingCart, ArrowLeftRight } from 'lucide-react';
import * as salesAction from '@/actions/App/Http/Controllers/PenjualanController';
import { formatRupiah } from '@/lib/utils';

interface Product {
    id: number
    nama_produk: string
    satuan: string
    harga_jual: number
    stok: number
}

interface Customer {
    id: number
    nama_pelanggan: string
}
interface PaymentMethod {
    id: number
    nama_metode: string
}

interface Batch {
    id: number
    kode: string
    keterangan: string
}

interface Props {
    products: Product[]
    customers: Customer[]
    paymentMethods: PaymentMethod[]
    batches: Batch[]
}

interface Item {
    produk_id: string
    qty: string
    harga_satuan: string
}

export default function SalesCreate({ products, customers, paymentMethods, batches }: Props) {
    const [items, setItems] = useState<Item[]>([
        { produk_id: '', qty: '', harga_satuan: '' }
    ]);

    const form = useForm({
        pelanggan_id: '',
        nama_lengkap: '',
        metode_pembayaran_id: '',
        pre_order_id: '',
        no_faktur: '',
        status_pembayaran: 'belum_bayar',
        items: [] as Item[],
    });

    // Default pelanggan selalu kategori "Umum" (orang biasa).
    useEffect(() => {
        const umum = customers.find(c => c.nama_pelanggan.toLowerCase() === 'umum');
        if (umum && form.data.pelanggan_id === '') {
            form.setData('pelanggan_id', String(umum.id));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customers]);

    function addItem() {
        setItems(prev => [...prev, { produk_id: '', qty: '', harga_satuan: '' }]);
    }

    function removeItem(index: number) {
        if (items.length === 1) return;
        setItems(prev => prev.filter((_, i) => i !== index));
    }

    function updateItem(index: number, field: keyof Item, value: string) {
        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            // Auto-fill harga_satuan dari master data produk saat produk dipilih
            if (field === 'produk_id') {
                const prod = products.find(p => p.id === Number(value));
                if (prod) {
                    updated[index].harga_satuan = String(prod.harga_jual);
                }
            }
            return updated;
        });
    }

    function calculateSubtotal(item: Item): number {
        return Number(item.qty) * Number(item.harga_satuan);
    }

    function calculateTotal(): number {
        return items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
    }

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const action = salesAction.store();
        form.transform((data) => ({ ...data, items }));
        form.submit(action.method, action.url, {
            onSuccess: () => {
                toast.success('Transaksi Penjualan Berhasil Dicatat.');
            },
            onError: () => {
                toast.error('Terdapat kesalahan pada form. Silakan periksa kembali.');
            }
        });
    }

    return (
        <>
            <Head title="Catat Pre-Order" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <form onSubmit={submit} className="space-y-6 max-w-4xl">

                    {/* Header Penjualan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Informasi Pre-Order
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FieldGroup>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="no_faktur">No. Faktur (Invoice)</FieldLabel>
                                        <Input
                                            id="no_faktur"
                                            placeholder="Contoh: INV-0001 (Kosongkan untuk auto-generate)"
                                            value={form.data.no_faktur}
                                            onChange={e => form.setData('no_faktur', e.target.value)}
                                        />
                                        {form.errors.no_faktur && <FieldError>{form.errors.no_faktur}</FieldError>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="pelanggan_id">Kategori Pembeli</FieldLabel>
                                        <Select
                                            value={form.data.pelanggan_id}
                                            onValueChange={val => form.setData('pelanggan_id', val)}
                                        >
                                            <SelectTrigger id="pelanggan_id" className="w-full">
                                                <SelectValue placeholder="Pilih kategori" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {customers.map(c => (
                                                    <SelectItem key={c.id} value={String(c.id)}>{c.nama_pelanggan}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.pelanggan_id && <FieldError>{form.errors.pelanggan_id}</FieldError>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="nama_lengkap">Nama Lengkap (Opsional)</FieldLabel>
                                        <Input
                                            id="nama_lengkap"
                                            placeholder="Nama pembeli, kalau perlu dicatat"
                                            value={form.data.nama_lengkap}
                                            onChange={e => form.setData('nama_lengkap', e.target.value)}
                                        />
                                        {form.errors.nama_lengkap && <FieldError>{form.errors.nama_lengkap}</FieldError>}
                                    </Field>
                                </div>

                                <Field>
                                    <FieldLabel htmlFor="pre_order_id">Batch Pre-Order</FieldLabel>
                                    <Select value={form.data.pre_order_id || 'none'} onValueChange={val => form.setData('pre_order_id', val === 'none' ? '' : val)}>
                                        <SelectTrigger id="pre_order_id" className="w-full"><SelectValue placeholder="Pilih batch (opsional)" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Tanpa batch</SelectItem>
                                            {batches.map(batch => <SelectItem key={batch.id} value={String(batch.id)}>{batch.kode} - {batch.keterangan}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.pre_order_id && <FieldError>{form.errors.pre_order_id}</FieldError>}
                                </Field>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="status_pembayaran">Status Pembayaran</FieldLabel>
                                        <Select
                                            value={form.data.status_pembayaran}
                                            onValueChange={val => form.setData('status_pembayaran', val)}
                                        >
                                            <SelectTrigger id="status_pembayaran" className="w-full">
                                                <SelectValue placeholder="Pilih status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                                                <SelectItem value="sudah_bayar">Sudah Bayar</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {form.errors.status_pembayaran && <FieldError>{form.errors.status_pembayaran}</FieldError>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="metode_pembayaran_id">Metode Pembayaran</FieldLabel>
                                        <Select
                                            value={form.data.metode_pembayaran_id}
                                            onValueChange={val => form.setData('metode_pembayaran_id', val)}
                                        >
                                            <SelectTrigger id="metode_pembayaran_id" className="w-full">
                                                <SelectValue placeholder="Pilih metode" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {paymentMethods.map(m => (
                                                    <SelectItem key={m.id} value={String(m.id)}>{m.nama_metode}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.metode_pembayaran_id && <FieldError>{form.errors.metode_pembayaran_id}</FieldError>}
                                    </Field>

                                </div>
                            </FieldGroup>
                        </CardContent>
                    </Card>

                    {/* Detail Items */}
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base font-bold">Produk yang Dijual</CardTitle>
                                <span className="text-[11px] text-muted-foreground md:hidden flex items-center gap-1 mt-0.5">
                                    <ArrowLeftRight className="h-3 w-3 text-primary animate-pulse" /> Geser tabel untuk input kolom
                                </span>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="rounded-xl h-8 text-xs">
                                <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Baris
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto custom-scrollbar touch-scroll">
                                <table className="min-w-[560px] w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-muted-foreground">
                                            <th className="pb-2 text-left font-medium">Produk Jadi</th>
                                            <th className="pb-2 text-left font-medium w-28">Qty</th>
                                            <th className="pb-2 text-left font-medium w-44">Harga Jual (Rp)</th>
                                            <th className="pb-2 text-right font-medium w-40">Subtotal</th>
                                            <th className="pb-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-2 pr-2">
                                                    <Select
                                                        value={item.produk_id}
                                                        onValueChange={val => updateItem(index, 'produk_id', val)}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Pilih produk" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products.map(p => (
                                                                <SelectItem key={p.id} value={String(p.id)}>
                                                                    {p.nama_produk} (Stok: {p.stok} {p.satuan})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {(form.errors as any)[`items.${index}.produk_id`] && (
                                                        <p className="text-xs text-destructive mt-1">{(form.errors as any)[`items.${index}.produk_id`]}</p>
                                                    )}
                                                </td>
                                                <td className="py-2 pr-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder="0"
                                                        value={item.qty}
                                                        onChange={e => updateItem(index, 'qty', e.target.value)}
                                                    />
                                                    {(form.errors as any)[`items.${index}.qty`] && (
                                                        <p className="text-xs text-destructive mt-1">{(form.errors as any)[`items.${index}.qty`]}</p>
                                                    )}
                                                </td>
                                                <td className="py-2 pr-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        placeholder="0"
                                                        value={item.harga_satuan}
                                                        onChange={e => updateItem(index, 'harga_satuan', e.target.value)}
                                                    />
                                                    {(form.errors as any)[`items.${index}.harga_satuan`] && (
                                                        <p className="text-xs text-destructive mt-1">{(form.errors as any)[`items.${index}.harga_satuan`]}</p>
                                                    )}
                                                </td>
                                                <td className="py-2 pr-2 text-right font-medium">
                                                    {formatRupiah(calculateSubtotal(item))}
                                                </td>
                                                <td className="py-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeItem(index)}
                                                        disabled={items.length === 1}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t">
                                            <td colSpan={3} className="pt-3 pr-2 text-right font-semibold text-muted-foreground">Total Penjualan:</td>
                                            <td className="pt-3 text-right font-bold text-lg">{formatRupiah(calculateTotal())}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {(form.errors as any)['items'] && (
                                <p className="text-xs text-destructive mt-2">{(form.errors as any)['items']}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(salesAction.index().url)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Menyimpan...' : 'Simpan Pre-Order'}
                        </Button>
                    </div>

                </form>
            </div>
        </>
    );
}

SalesCreate.layout = {
    breadcrumbs: [
        { title: 'Pre-Order', href: salesAction.index() },
        { title: 'Catat Pre-Order', href: salesAction.create() },
    ],
};
