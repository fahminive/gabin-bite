import { Head } from '@inertiajs/react';
import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
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
import { SearchCheck } from 'lucide-react';
import * as stockCorrectionsAction from '@/actions/App/Http/Controllers/KoreksiStokController';

interface Product {
    id: number
    nama_produk: string
    satuan: string
    stok: number
}

interface Props {
    products: Product[]
}

export default function StockCorrectionCreate({ products }: Props) {
    const [jenisKoreksi, setJenisKoreksi] = useState<'masuk' | 'keluar'>('keluar');

    const form = useForm({
        tanggal: new Date().toISOString().split('T')[0],
        produk_id: '',
        jenis_koreksi: 'keluar' as 'masuk' | 'keluar',
        qty: '',
        keterangan: '',
    });

    function handleJenisChange(val: 'masuk' | 'keluar') {
        setJenisKoreksi(val);
        form.setData('jenis_koreksi', val);
    }

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const action = stockCorrectionsAction.store();
        form.submit(action.method, action.url, {
            onSuccess: () => {
                toast.success('Koreksi Stok Berhasil Dicatat.');
            },
            onError: () => {
                toast.error('Terdapat kesalahan pada form. Silakan periksa kembali.');
            }
        });
    }

    return (
        <>
            <Head title="Catat Koreksi Stok" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <form onSubmit={submit} className="space-y-6 max-w-2xl">

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <SearchCheck className="h-5 w-5" />
                                Form Koreksi Stok (Stock Opname)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FieldGroup>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="tanggal">Tanggal Koreksi</FieldLabel>
                                        <Input
                                            id="tanggal"
                                            type="date"
                                            value={form.data.tanggal}
                                            onChange={e => form.setData('tanggal', e.target.value)}
                                        />
                                        {form.errors.tanggal && <FieldError>{form.errors.tanggal}</FieldError>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="produk_id">Produk Jadi</FieldLabel>
                                        <Select
                                            value={form.data.produk_id}
                                            onValueChange={val => form.setData('produk_id', val)}
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
                                        <FieldLabel>Jenis Penyesuaian</FieldLabel>
                                        <div className="flex gap-3 mt-1">
                                            {(['masuk', 'keluar'] as const).map(jenis => (
                                                <button
                                                    key={jenis}
                                                    type="button"
                                                    onClick={() => handleJenisChange(jenis)}
                                                    className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors capitalize ${jenisKoreksi === jenis
                                                        ? jenis === 'masuk'
                                                            ? 'border-green-600 bg-green-600 text-white'
                                                            : 'border-destructive bg-destructive text-destructive-foreground'
                                                        : 'border-input bg-background hover:bg-accent'
                                                    }`}
                                                >
                                                    Koreksi {jenis}
                                                </button>
                                            ))}
                                        </div>
                                        {form.errors.jenis_koreksi && <FieldError>{form.errors.jenis_koreksi}</FieldError>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="qty">Kuantitas Penyesuaian</FieldLabel>
                                        <Input
                                            id="qty"
                                            type="number"
                                            min="1"
                                            placeholder="Contoh: 5"
                                            value={form.data.qty}
                                            onChange={e => form.setData('qty', e.target.value)}
                                        />
                                        {form.errors.qty && <FieldError>{form.errors.qty}</FieldError>}
                                    </Field>
                                </div>

                                <Field>
                                    <FieldLabel htmlFor="keterangan">Keterangan / Alasan Koreksi</FieldLabel>
                                    <Textarea
                                        id="keterangan"
                                        placeholder="Contoh: Makaroni kadaluarsa, rusak, atau untuk tester pelanggan"
                                        value={form.data.keterangan}
                                        onChange={e => form.setData('keterangan', e.target.value)}
                                        rows={3}
                                    />
                                    {form.errors.keterangan && <FieldError>{form.errors.keterangan}</FieldError>}
                                </Field>
                            </FieldGroup>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(stockCorrectionsAction.index().url)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Menyimpan...' : 'Simpan Koreksi'}
                        </Button>
                    </div>

                </form>
            </div>
        </>
    );
}

StockCorrectionCreate.layout = {
    breadcrumbs: [
        { title: 'Koreksi Stok', href: stockCorrectionsAction.index() },
        { title: 'Catat Koreksi', href: stockCorrectionsAction.create() },
    ],
};
