import { Head } from '@inertiajs/react';
import { useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Trash2, CookingPot } from 'lucide-react';
import * as productionsAction from '@/actions/App/Http/Controllers/ProduksiController';

interface Product {
    id: number
    nama_produk: string
    satuan: string
    stok: number
}

interface BahanBaku {
    id: number
    nama_bahan: string
    satuan: string
    stok: number
}

interface Recipe {
    id: number
    produk_id: number
    bahan_baku_id: number
    qty: number
}

interface Props {
    products: Product[]
    bahanBakus: BahanBaku[]
    recipes: Recipe[]
}

interface Item {
    bahan_baku_id: string
    qty_bahan_dipakai: string
}

export default function ProductionCreate({ products, bahanBakus, recipes }: Props) {
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [qtyHasil, setQtyHasil] = useState<string>('1');
    const [items, setItems] = useState<Item[]>([
        { bahan_baku_id: '', qty_bahan_dipakai: '' }
    ]);

    const form = useForm({
        tanggal: new Date().toISOString().split('T')[0],
        produk_id: '',
        qty_hasil: 1,
        keterangan: '',
        items: [] as Item[],
    });

    // Auto-fill items based on recipe when product or qty_hasil changes
    useEffect(() => {
        if (!selectedProductId) return;

        const productRecipes = recipes.filter(r => r.produk_id === Number(selectedProductId));
        if (productRecipes.length > 0) {
            const calculatedItems = productRecipes.map(r => ({
                bahan_baku_id: String(r.bahan_baku_id),
                qty_bahan_dipakai: String(r.qty * (Number(qtyHasil) || 1))
            }));
            setItems(calculatedItems);
        }
    }, [selectedProductId, qtyHasil, recipes]);

    function addItem() {
        setItems(prev => [...prev, { bahan_baku_id: '', qty_bahan_dipakai: '' }]);
    }

    function removeItem(index: number) {
        if (items.length === 1) return;
        setItems(prev => prev.filter((_, i) => i !== index));
    }

    function updateItem(index: number, field: keyof Item, value: string) {
        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }

    function handleProductChange(val: string) {
        setSelectedProductId(val);
        form.setData('produk_id', val);
    }

    function handleQtyHasilChange(val: string) {
        setQtyHasil(val);
        form.setData('qty_hasil', Number(val) || 0);
    }

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const action = productionsAction.store();
        form.transform((data) => ({
            ...data,
            items: items.map(item => ({
                bahan_baku_id: item.bahan_baku_id,
                qty_bahan_dipakai: String(Number(item.qty_bahan_dipakai) || 0)
            }))
        }));
        form.submit(action.method, action.url, {
            onSuccess: () => {
                toast.success('Transaksi Produksi Berhasil Dicatat.');
            },
            onError: () => {
                toast.error('Terdapat kesalahan pada form. Silakan periksa kembali.');
            }
        });
    }

    return (
        <>
            <Head title="Mulai Produksi" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <form onSubmit={submit} className="space-y-6 max-w-4xl">

                    {/* Header Produksi */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CookingPot className="h-5 w-5" />
                                Informasi Produksi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FieldGroup>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="tanggal">Tanggal Produksi</FieldLabel>
                                        <Input
                                            id="tanggal"
                                            type="date"
                                            value={form.data.tanggal}
                                            onChange={e => form.setData('tanggal', e.target.value)}
                                        />
                                        {form.errors.tanggal && <FieldError>{form.errors.tanggal}</FieldError>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="produk_id">Produk Jadi yang Dihasilkan</FieldLabel>
                                        <Select
                                            value={form.data.produk_id}
                                            onValueChange={handleProductChange}
                                        >
                                            <SelectTrigger id="produk_id" className="w-full">
                                                <SelectValue placeholder="Pilih produk jadi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.nama_produk} (Stok: {p.stok} {p.satuan})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.produk_id && <FieldError>{form.errors.produk_id}</FieldError>}
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="qty_hasil">Kuantitas Hasil Produksi</FieldLabel>
                                        <Input
                                            id="qty_hasil"
                                            type="number"
                                            min="1"
                                            placeholder="Contoh: 100"
                                            value={qtyHasil}
                                            onChange={e => handleQtyHasilChange(e.target.value)}
                                        />
                                        {form.errors.qty_hasil && <FieldError>{form.errors.qty_hasil}</FieldError>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="keterangan">Keterangan / Catatan</FieldLabel>
                                        <Textarea
                                            id="keterangan"
                                            placeholder="Contoh: Produksi batch makaroni keju original pagi hari"
                                            value={form.data.keterangan}
                                            onChange={e => form.setData('keterangan', e.target.value)}
                                            rows={2}
                                        />
                                        {form.errors.keterangan && <FieldError>{form.errors.keterangan}</FieldError>}
                                    </Field>
                                </div>
                            </FieldGroup>
                        </CardContent>
                    </Card>

                    {/* Detail Pemakaian Bahan */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Bahan Baku yang Digunakan</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="h-4 w-4 mr-1" /> Tambah Baris
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-muted-foreground">
                                            <th className="pb-2 text-left font-medium">Bahan Baku</th>
                                            <th className="pb-2 text-left font-medium w-48">Qty Dipakai</th>
                                            <th className="pb-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-2 pr-2">
                                                    <Select
                                                        value={item.bahan_baku_id}
                                                        onValueChange={val => updateItem(index, 'bahan_baku_id', val)}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Pilih bahan baku" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {bahanBakus.map(b => (
                                                                <SelectItem key={b.id} value={String(b.id)}>
                                                                    {b.nama_bahan} (Stok: {b.stok} {b.satuan})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {(form.errors as any)[`items.${index}.bahan_baku_id`] && (
                                                        <p className="text-xs text-destructive mt-1">{(form.errors as any)[`items.${index}.bahan_baku_id`]}</p>
                                                    )}
                                                </td>
                                                <td className="py-2 pr-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder="0"
                                                        value={item.qty_bahan_dipakai}
                                                        onChange={e => updateItem(index, 'qty_bahan_dipakai', e.target.value)}
                                                    />
                                                    {(form.errors as any)[`items.${index}.qty_bahan_dipakai`] && (
                                                        <p className="text-xs text-destructive mt-1">{(form.errors as any)[`items.${index}.qty_bahan_dipakai`]}</p>
                                                    )}
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
                            onClick={() => router.visit(productionsAction.index().url)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Menyimpan...' : 'Simpan Transaksi Produksi'}
                        </Button>
                    </div>

                </form>
            </div>
        </>
    );
}

ProductionCreate.layout = {
    breadcrumbs: [
        { title: 'Produksi & Manufaktur', href: productionsAction.index() },
        { title: 'Mulai Produksi', href: productionsAction.create() },
    ],
};
