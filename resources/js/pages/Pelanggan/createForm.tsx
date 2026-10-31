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
        no_telepon: string | null
        alamat?: string | null
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
        no_telepon: pelanggan?.no_telepon ?? "",
        alamat: pelanggan?.alamat ?? "",
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

                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="no_telepon">
                            No. Telepon
                        </FieldLabel>

                        <Input
                            id="no_telepon"
                            placeholder="Contoh: 08123456789"
                            value={form.data.no_telepon}
                            onChange={(e) =>
                                form.setData(
                                    "no_telepon",
                                    e.target.value
                                )
                            }
                        />

                        {form.errors.no_telepon && (
                            <FieldError>
                                {form.errors.no_telepon}
                            </FieldError>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="alamat">
                            Alamat (opsional)
                        </FieldLabel>

                        <Input
                            id="alamat"
                            placeholder="Contoh: Jl. Merdeka No. 1"
                            value={form.data.alamat}
                            onChange={(e) =>
                                form.setData(
                                    "alamat",
                                    e.target.value
                                )
                            }
                        />

                        {form.errors.alamat && (
                            <FieldError>
                                {form.errors.alamat}
                            </FieldError>
                        )}
                    </Field>
                </div>

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
