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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import * as equipments from "@/actions/App/Http/Controllers/PeralatanController"

interface Props {
    peralatan?: {
        id: number
        kode: string
        nama_alat: string
        harga_perolehan: string
        tgl_beli: string
        umur_ekonomis: number
        persentase_penyusutan: string
        status_alat: 'layak_pakai' | 'tidak_layak_pakai'
    }
    defaultKode?: string
}

export function PeralatanForm({
    peralatan,
    defaultKode
}: Props) {

    const isEdit = !!peralatan

    const form = useForm({
        kode: peralatan?.kode ?? defaultKode ?? "",
        nama_alat: peralatan?.nama_alat ?? "",
        harga_perolehan: peralatan?.harga_perolehan ?? "",
        tgl_beli: peralatan?.tgl_beli ?? "",
        umur_ekonomis: peralatan?.umur_ekonomis ?? "",
        persentase_penyusutan: peralatan?.persentase_penyusutan ?? "0",
        status_alat: peralatan?.status_alat ?? "layak_pakai",
    })

    function submit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault()

        const action = isEdit
            ? equipments.update(peralatan.id)
            : equipments.store()

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
                        Kode Peralatan
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
                    <FieldLabel htmlFor="nama_alat">
                        Nama Alat
                    </FieldLabel>

                    <Input
                        id="nama_alat"
                        placeholder="Contoh: Mesin Penggorengan, Kompor Gas"
                        value={form.data.nama_alat}
                        onChange={(e) =>
                            form.setData(
                                "nama_alat",
                                e.target.value
                            )
                        }
                    />

                    {form.errors.nama_alat && (
                        <FieldError>
                            {form.errors.nama_alat}
                        </FieldError>
                    )}
                </Field>

                <div className="grid md:grid-cols-3 gap-4">
                    <Field>
                        <FieldLabel htmlFor="harga_perolehan">
                            Harga Perolehan
                        </FieldLabel>

                        <Input
                            id="harga_perolehan"
                            type="number"
                            placeholder="Contoh: 1500000"
                            value={form.data.harga_perolehan}
                            onChange={(e) =>
                                form.setData(
                                    "harga_perolehan",
                                    e.target.value
                                )
                            }
                        />

                        {form.errors.harga_perolehan && (
                            <FieldError>
                                {form.errors.harga_perolehan}
                            </FieldError>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="umur_ekonomis">
                            Umur Ekonomis (Bulan)
                        </FieldLabel>

                        <Input
                            id="umur_ekonomis"
                            type="number"
                            placeholder="Contoh: 48"
                            value={form.data.umur_ekonomis}
                            onChange={(e) =>
                                form.setData(
                                    "umur_ekonomis",
                                    e.target.value
                                )
                            }
                        />

                        {form.errors.umur_ekonomis && (
                            <FieldError>
                                {form.errors.umur_ekonomis}
                            </FieldError>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="persentase_penyusutan">
                            Penyusutan per Bulan (%)
                        </FieldLabel>

                        <Input
                            id="persentase_penyusutan"
                            type="number"
                            step="0.01"
                            placeholder="Contoh: 0.42"
                            value={form.data.persentase_penyusutan}
                            onChange={(e) =>
                                form.setData(
                                    "persentase_penyusutan",
                                    e.target.value
                                )
                            }
                        />

                        {form.errors.persentase_penyusutan && (
                            <FieldError>
                                {form.errors.persentase_penyusutan}
                            </FieldError>
                        )}
                    </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="tgl_beli">
                            Tanggal Pembelian
                        </FieldLabel>

                        <Input
                            id="tgl_beli"
                            type="date"
                            value={form.data.tgl_beli}
                            onChange={(e) =>
                                form.setData(
                                    "tgl_beli",
                                    e.target.value
                                )
                            }
                        />

                        {form.errors.tgl_beli && (
                            <FieldError>
                                {form.errors.tgl_beli}
                            </FieldError>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="status_alat">
                            Status Kelayakan Alat
                        </FieldLabel>

                        <Select
                            value={form.data.status_alat}
                            onValueChange={(val) =>
                                form.setData(
                                    "status_alat",
                                    val as 'layak_pakai' | 'tidak_layak_pakai'
                                )
                            }
                        >
                            <SelectTrigger id="status_alat" className="w-full">
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="layak_pakai">
                                    Layak Pakai
                                </SelectItem>
                                <SelectItem value="tidak_layak_pakai">
                                    Tidak Layak Pakai
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {form.errors.status_alat && (
                            <FieldError>
                                {form.errors.status_alat}
                            </FieldError>
                        )}
                    </Field>
                </div>

                <div className="flex gap-4 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit(equipments.index().url)}
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
