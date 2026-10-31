import { useForm, usePage } from '@inertiajs/react';
import { Plus, Building, User } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import * as cashAction from '@/actions/App/Http/Controllers/KasController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';

export function CreateAdjustment() {
    const [open, setOpen] = React.useState(false);
    const { mitras } = usePage().props as any;

    const form = useForm({
        tanggal: new Date().toISOString().split('T')[0],
        tipe_penyesuaian: 'masuk' as 'masuk' | 'keluar',
        nominal: '',
        keterangan: '',
        sumber_dana: 'simpanan_usaha' as 'simpanan_usaha' | 'pribadi',
        mitra_id: '',
    });

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const action = cashAction.store();

        form.submit(action.method, action.url, {
            onSuccess: () => {
                setOpen(false);
                form.reset();
                toast.success('Penyesuaian kas berhasil disimpan.');
            },
            onError: () => {
                toast.error(
                    'Terdapat kesalahan pada form. Silakan periksa kembali.',
                );
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Catat Penyesuaian Kas
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>Catat Penyesuaian Kas Manual</DialogTitle>
                        <DialogDescription>
                            Gunakan form ini untuk mencatat transaksi kas manual
                            non-sistem (selain setoran modal, operasional,
                            pembelian, atau penjualan).
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup className="py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="tanggal">
                                    Tanggal
                                </FieldLabel>
                                <Input
                                    id="tanggal"
                                    type="date"
                                    value={form.data.tanggal}
                                    onChange={(e) =>
                                        form.setData('tanggal', e.target.value)
                                    }
                                />
                                {form.errors.tanggal && (
                                    <FieldError>
                                        {form.errors.tanggal}
                                    </FieldError>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="tipe_penyesuaian">
                                    Jenis Aliran
                                </FieldLabel>
                                <Select
                                    value={form.data.tipe_penyesuaian}
                                    onValueChange={(val) =>
                                        form.setData(
                                            'tipe_penyesuaian',
                                            val as 'masuk' | 'keluar',
                                        )
                                    }
                                >
                                    <SelectTrigger id="tipe_penyesuaian">
                                        <SelectValue placeholder="Pilih jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="masuk">
                                            Uang Masuk (+)
                                        </SelectItem>
                                        <SelectItem value="keluar">
                                            Uang Keluar (-)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.errors.tipe_penyesuaian && (
                                    <FieldError>
                                        {form.errors.tipe_penyesuaian}
                                    </FieldError>
                                )}
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel htmlFor="nominal">
                                Nominal (Rupiah)
                            </FieldLabel>
                            <Input
                                id="nominal"
                                type="number"
                                placeholder="Contoh: 150000"
                                value={form.data.nominal}
                                onChange={(e) =>
                                    form.setData('nominal', e.target.value)
                                }
                            />
                            {form.errors.nominal && (
                                <FieldError>{form.errors.nominal}</FieldError>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="sumber_dana">
                                Sumber Dana
                            </FieldLabel>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        form.setData(
                                            'sumber_dana',
                                            'simpanan_usaha',
                                        )
                                    }
                                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-sm font-medium transition ${
                                        form.data.sumber_dana ===
                                        'simpanan_usaha'
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input hover:bg-muted'
                                    }`}
                                >
                                    <Building className="mb-1 h-4 w-4" />
                                    Uang Bisnis
                                    <span className="text-[10px] opacity-70">
                                        Simpanan Usaha
                                    </span>
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() =>
                                        form.setData('sumber_dana', 'pribadi')
                                    }
                                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-sm font-medium transition ${
                                        form.data.sumber_dana === 'pribadi'
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input hover:bg-muted'
                                    }`}
                                >
                                    <User className="mb-1 h-4 w-4" />
                                    Member Tim
                                    <span className="text-[10px] opacity-70">
                                        Uang Pribadi Partner
                                    </span>
                                </Button>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Pilih apakah penyesuaian ini dibiayai dari
                                simpanan usaha atau uang pribadi salah satu
                                member tim.
                            </p>
                            {form.errors.sumber_dana && (
                                <FieldError>
                                    {form.errors.sumber_dana}
                                </FieldError>
                            )}
                        </Field>

                        {form.data.sumber_dana === 'pribadi' && (
                            <Field>
                                <FieldLabel htmlFor="mitra_id">
                                    Member Tim yang Membayar
                                </FieldLabel>
                                <Select
                                    value={form.data.mitra_id}
                                    onValueChange={(val) =>
                                        form.setData(
                                            'mitra_id',
                                            String(val ?? ''),
                                        )
                                    }
                                >
                                    <SelectTrigger id="mitra_id">
                                        <SelectValue placeholder="Pilih member tim" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(mitras ?? []).map((m: any) => (
                                            <SelectItem
                                                key={m.id}
                                                value={String(m.id)}
                                            >
                                                {m.kode} — {m.nama}
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

                        <Field>
                            <FieldLabel htmlFor="keterangan">
                                Keterangan / Alasan
                            </FieldLabel>
                            <Textarea
                                id="keterangan"
                                placeholder="Contoh: Selisih perhitungan kas fisik di laci"
                                value={form.data.keterangan}
                                onChange={(e) =>
                                    form.setData('keterangan', e.target.value)
                                }
                                rows={3}
                            />
                            {form.errors.keterangan && (
                                <FieldError>
                                    {form.errors.keterangan}
                                </FieldError>
                            )}
                        </Field>
                    </FieldGroup>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? 'Menyimpan...'
                                : 'Simpan Penyesuaian'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
