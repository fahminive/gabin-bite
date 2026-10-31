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
import * as modalsAction from "@/actions/App/Http/Controllers/ModalController"

interface Props {
    modal?: {
        id: number
        nominal: string
        tipe: 'Uang Tunai' | 'Peralatan / Aset' | 'Lainnya'
        keterangan: string | null
    }
}

export function ModalForm({
    modal
}: Props) {

    const isEdit = !!modal

    const form = useForm({
        nominal: modal?.nominal ?? "",
        tipe: modal?.tipe ?? "Uang Tunai",
        keterangan: modal?.keterangan ?? "",
    })

    function submit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault()

        const action = isEdit
            ? modalsAction.update(modal.id)
            : modalsAction.store()

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
                <Field>
                    <FieldLabel htmlFor="nominal">
                        Nominal (Rupiah)
                    </FieldLabel>

                    <Input
                        id="nominal"
                        type="number"
                        placeholder="Contoh: 10000000"
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
                    <FieldLabel htmlFor="tipe">
                        Tipe Modal
                    </FieldLabel>

                    <Select
                        value={form.data.tipe}
                        onValueChange={(val) =>
                            form.setData(
                                "tipe",
                                val as 'Uang Tunai' | 'Peralatan / Aset' | 'Lainnya'
                            )
                        }
                    >
                        <SelectTrigger id="tipe" className="w-full">
                            <SelectValue placeholder="Pilih tipe modal" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Uang Tunai">
                                Uang Tunai (Masuk Kas)
                            </SelectItem>
                            <SelectItem value="Peralatan / Aset">
                                Peralatan / Aset (Non-Kas)
                            </SelectItem>
                            <SelectItem value="Lainnya">
                                Lainnya (Non-Kas)
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {form.errors.tipe && (
                        <FieldError>
                            {form.errors.tipe}
                        </FieldError>
                    )}
                </Field>

                <Field>
                    <FieldLabel htmlFor="keterangan">
                        Keterangan
                    </FieldLabel>

                    <Textarea
                        id="keterangan"
                        placeholder="Contoh: Setoran modal awal dari Bapak Budi"
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
                        onClick={() => router.visit(modalsAction.index().url)}
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
