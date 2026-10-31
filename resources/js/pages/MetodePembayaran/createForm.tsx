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
import * as paymentMethods from "@/actions/App/Http/Controllers/MetodePembayaranController"

interface Props {
    paymentMethod?: {
        id: number
        kode: string
        nama_metode: string
    }
    defaultKode?: string
}

export function MetodePembayaranForm({
    paymentMethod,
    defaultKode
}: Props) {

    const isEdit = !!paymentMethod

    const form = useForm({
        kode: paymentMethod?.kode ?? defaultKode ?? "",
        nama_metode: paymentMethod?.nama_metode ?? "",
    })

    function submit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault()

        const action = isEdit
            ? paymentMethods.update(paymentMethod.id)
            : paymentMethods.store()

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
                    <FieldLabel htmlFor="kode">
                        Kode Metode Pembayaran
                    </FieldLabel>

                    <Input
                        id="kode"
                        placeholder="Contoh: MP-0001"
                        value={form.data.kode}
                        onChange={(e) =>
                            form.setData(
                                "kode",
                                e.target.value
                            )
                        }
                    />

                    {form.errors.kode && (
                        <FieldError>
                            {form.errors.kode}
                        </FieldError>
                    )}
                </Field>

                <Field>
                    <FieldLabel htmlFor="nama_metode">
                        Nama Metode Pembayaran
                    </FieldLabel>

                    <Input
                        id="nama_metode"
                        placeholder="Contoh: Transfer Bank Mandiri, Cash, COD"
                        value={form.data.nama_metode}
                        onChange={(e) =>
                            form.setData(
                                "nama_metode",
                                e.target.value
                            )
                        }
                    />

                    {form.errors.nama_metode && (
                        <FieldError>
                            {form.errors.nama_metode}
                        </FieldError>
                    )}
                </Field>

                <div className="flex gap-4 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit(paymentMethods.index().url)}
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
