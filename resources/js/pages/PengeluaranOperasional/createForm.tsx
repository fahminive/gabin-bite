import { useForm } from "@inertiajs/react"
import { router } from "@inertiajs/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import * as expensesAction from "@/actions/App/Http/Controllers/PengeluaranOperasionalController"

interface Props {
    expense?: {
        id: number
        tanggal: string
        kategori: 'Gaji' | 'Utilitas (Listrik/Air)' | 'Sewa Tempat' | 'Transportasi & Bensin' | 'Lain-lain'
        nominal: string
        keterangan: string | null
    }
}

export function ExpenseForm({
    expense
}: Props) {

    const isEdit = !!expense

    const form = useForm({
        tanggal: expense?.tanggal ?? new Date().toISOString().split('T')[0],
        kategori: expense?.kategori ?? "Gaji",
        nominal: expense?.nominal ?? "",
        keterangan: expense?.keterangan ?? "",
    })

    function submit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault()

        const action = isEdit
            ? expensesAction.update(expense.id)
            : expensesAction.store()

        form.submit(action.method, action.url, {
            onSuccess: () => {
                // Success message handled by index component
            },

            onError: () => {
                toast.error(
                    "Terdapat kesalahan pada form. Silakan periksa kembali."
                )
            }
        })
    }

    return (
        <form onSubmit={submit}>
            <FieldGroup className="max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="tanggal">
                            Tanggal Biaya
                        </FieldLabel>

                        <Input
                            id="tanggal"
                            type="date"
                            value={form.data.tanggal}
                            onChange={(e) =>
                                form.setData(
                                    "tanggal",
                                    e.target.value
                                )
                            }
                        />

                        {form.errors.tanggal && (
                            <FieldError>
                                {form.errors.tanggal}
                            </FieldError>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="kategori">
                            Kategori Biaya
                        </FieldLabel>

                        <Select
                            value={form.data.kategori}
                            onValueChange={(val) =>
                                form.setData(
                                    "kategori",
                                    val as 'Gaji' | 'Utilitas (Listrik/Air)' | 'Sewa Tempat' | 'Transportasi & Bensin' | 'Lain-lain'
                                )
                            }
                        >
                            <SelectTrigger id="kategori" className="w-full">
                                <SelectValue placeholder="Pilih kategori biaya" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Gaji">
                                    Gaji Karyawan
                                </SelectItem>
                                <SelectItem value="Utilitas (Listrik/Air)">
                                    Utilitas (Listrik/Air/Internet)
                                </SelectItem>
                                <SelectItem value="Sewa Tempat">
                                    Sewa Tempat
                                </SelectItem>
                                <SelectItem value="Transportasi & Bensin">
                                    Transportasi & Bensin
                                </SelectItem>
                                <SelectItem value="Lain-lain">
                                    Lain-lain
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {form.errors.kategori && (
                            <FieldError>
                                {form.errors.kategori}
                            </FieldError>
                        )}
                    </Field>
                </div>

                <Field>
                    <FieldLabel htmlFor="nominal">
                        Nominal Biaya (Rupiah)
                    </FieldLabel>

                    <Input
                        id="nominal"
                        type="number"
                        placeholder="Contoh: 350000"
                        value={form.data.nominal}
                        onChange={(e) =>
                            form.setData(
                                "nominal",
                                e.target.value
                            )
                        }
                    />

                    {form.errors.nominal && (
                        <FieldError>
                            {form.errors.nominal}
                        </FieldError>
                    )}
                </Field>

                <Field>
                    <FieldLabel htmlFor="keterangan">
                        Keterangan
                    </FieldLabel>

                    <Textarea
                        id="keterangan"
                        placeholder="Contoh: Pembayaran listrik ruko bulan Juni 2026"
                        value={form.data.keterangan}
                        onChange={(e) =>
                            form.setData(
                                "keterangan",
                                e.target.value
                            )
                        }
                        rows={4}
                    />

                    {form.errors.keterangan && (
                        <FieldError>
                            {form.errors.keterangan}
                        </FieldError>
                    )}
                </Field>

                <div className="flex gap-4 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit(expensesAction.index().url)}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                        disabled={form.processing}
                    >
                        Reset
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.processing}
                    >
                        {form.processing
                            ? "Menyimpan..."
                            : isEdit
                            ? "Update"
                            : "Simpan"}
                    </Button>         
                </div>
            </FieldGroup>
        </form>
    )
}
