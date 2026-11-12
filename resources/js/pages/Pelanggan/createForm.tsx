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
import * as customers from "@/actions/App/Http/Controllers/PelangganController"

interface Props {
    pelanggan?: {
        id: number
        kode: string
        nama_pelanggan: string
    }
    defaultKode?: string
}

export function PelangganForm({
    pelanggan,
    defaultKode
}: Props) {

    const isEdit = !!pelanggan

    const form = useForm({
        kode: pelanggan?.kode ?? defaultKode ?? "",
        nama_pelanggan: pelanggan?.nama_pelanggan ?? "",
    })

    function submit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault()

        const action = isEdit
            ? customers.update(pelanggan.id)
            : customers.store()

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
                        Kode Pelanggan
                    </FieldLabel>

                    <Input
                        id="kode"
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
                    <FieldLabel htmlFor="nama_pelanggan">
                        Nama Pelanggan
                    </FieldLabel>

                    <Input
                        id="nama_pelanggan"
                        value={form.data.nama_pelanggan}
                        onChange={(e) =>
                            form.setData(
                                "nama_pelanggan",
                                e.target.value
                            )
                        }
                    />

                    {form.errors.nama_pelanggan && (
                        <FieldError>
                            {form.errors.nama_pelanggan}
                        </FieldError>
                    )}
                </Field>

                <div className="flex gap-4 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit(customers.index().url)}
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
