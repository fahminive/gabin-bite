import { useForm } from "@inertiajs/react"
import { router } from "@inertiajs/react"
import React, { useEffect, useState } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import * as products from "@/actions/App/Http/Controllers/ProdukController"

interface BahanBaku {
    id: number
    nama_bahan: string
    satuan: string
    harga_satuan: number
}

interface ResepItem {
    bahan_baku_id: number
    qty: number
}

interface Props {
    product?: {
        id: number
        kode: string
        nama_produk: string
        stok: number
        hpp: number
        harga_jual: number
        satuan: string
        reseps?: ResepItem[]
    }
    defaultKode?: string
    bahanBakus: BahanBaku[]
}

interface FormRecipeItem {
    bahan_baku_id: string
    qty: string
}

export function ProdukForm({
    product,
    defaultKode,
    bahanBakus
}: Props) {

    const isEdit = !!product

    const form = useForm({
        kode: product?.kode ?? defaultKode ?? "",
        nama_produk: product?.nama_produk ?? "",
        stok: product?.stok ?? "",
        hpp: product?.hpp ?? "",
        harga_jual: product?.harga_jual ?? "",
        satuan: product?.satuan ?? "",
        recipe: product?.reseps?.map(r => ({
            bahan_baku_id: String(r.bahan_baku_id),
            qty: String(r.qty)
        })) || [{ bahan_baku_id: "", qty: "" }] as FormRecipeItem[]
    })

    const [isHppManual, setIsHppManual] = useState(isEdit); // if edit, assume manual to avoid overwrite

    // --- AUTO CALCULATE HPP ---
    useEffect(() => {
        if (isHppManual) return; // Skip if user explicitly typed it

        let totalCost = 0;
        form.data.recipe.forEach(item => {
            if (item.bahan_baku_id && item.qty) {
                const bb = bahanBakus.find(b => String(b.id) === String(item.bahan_baku_id));
                if (bb && bb.harga_satuan) {
                    totalCost += Number(item.qty) * Number(bb.harga_satuan);
                }
            }
        });

        if (totalCost > 0 && String(totalCost) !== form.data.hpp) {
            form.setData('hpp', String(totalCost));
        }
    }, [form.data.recipe, bahanBakus, isHppManual, form.data.hpp]);
    // --------------------------

    function addRecipeItem() {
        form.setData('recipe', [...form.data.recipe, { bahan_baku_id: '', qty: '' }]);
    }

    function removeRecipeItem(index: number) {
        if (form.data.recipe.length === 1) return;
        form.setData('recipe', form.data.recipe.filter((_, i) => i !== index));
    }

    function updateRecipeItem(index: number, field: 'bahan_baku_id' | 'qty', value: string) {
        const updated = [...form.data.recipe];
        updated[index] = { ...updated[index], [field]: value };
        form.setData('recipe', updated);
    }

    function submit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault()

        const action = isEdit
            ? products.update(product.id)
            : products.store()

        form.submit(action.method, action.url, {
            onSuccess: () => {
                // Success is handled by Index flash message
            },
            onError: (errors) => {
                toast.error("Terdapat kesalahan pada form. Silakan periksa kembali.")
            }
        })
    }

    return (
        <form onSubmit={submit}>
            <FieldGroup className="max-w-2xl">
                <Field>
                    <FieldLabel htmlFor="kode">
                        Kode Produk
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
                    <FieldLabel htmlFor="nama_produk">Nama Produk</FieldLabel>
                    <Input
                        id="nama_produk"
                        value={form.data.nama_produk}
                        onChange={(e) =>
                            form.setData(
                                "nama_produk",
                                e.target.value
                            )
                        }
                    />
                    {form.errors.nama_produk && (
                        <FieldError>
                            {form.errors.nama_produk}
                        </FieldError>
                    )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="satuan">Satuan</FieldLabel>
                        <Input
                            id="satuan"
                            placeholder="Contoh: Pcs, Box, Kg"
                            value={form.data.satuan}
                            onChange={(e) =>
                                form.setData(
                                    "satuan",
                                    e.target.value
                                )
                            }
                        />
                        {form.errors.satuan && (
                            <FieldError>
                                {form.errors.satuan}
                            </FieldError>
                        )}
                    </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="hpp">HPP (Harga Pokok Penjualan)</FieldLabel>
                        <Input
                            id="hpp"
                            type="number"
                            value={form.data.hpp}
                            onChange={(e) => {
                                setIsHppManual(true);
                                form.setData("hpp", e.target.value);
                            }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Biaya modal untuk memproduksi 1 satuan produk. { !isHppManual && "Dihitung otomatis dari resep." }
                        </p>
                        {form.errors.hpp && (
                            <FieldError>
                                {form.errors.hpp}
                            </FieldError>
                        )}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="harga_jual">Harga Jual</FieldLabel>
                        <Input
                            id="harga_jual"
                            type="number"
                            value={form.data.harga_jual}
                            onChange={(e) =>
                                form.setData(
                                    "harga_jual",
                                    e.target.value
                                )
                            }
                        />
                        {form.errors.harga_jual && (
                            <FieldError>
                                {form.errors.harga_jual}
                            </FieldError>
                        )}
                    </Field>
                </div>

                <Field>
                    <FieldLabel>Stok Fisik Awal</FieldLabel>
                    <Input
                        type="number"
                        value={form.data.stok}
                        disabled={isEdit}
                        onChange={(e) =>
                            form.setData(
                                "stok",
                                e.target.value
                            )
                        }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        {isEdit ? "Stok produk hanya bisa berubah lewat fitur Produksi, Penjualan, atau Koreksi Stok." : "Masukkan stok produk yang sudah jadi/tersedia saat ini."}
                    </p>

                    {form.errors.stok && (
                        <FieldError>
                            {form.errors.stok}
                        </FieldError>
                    )}
                </Field>

                {/* Resep Pemakaian Bahan Baku */}
                <Card className="mt-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold">Resep Kebutuhan Bahan Baku (per 1 unit Produk)</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addRecipeItem}>
                            <Plus className="h-4 w-4 mr-1" /> Tambah Bahan
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-muted-foreground">
                                        <th className="pb-2 text-left font-medium">Bahan Baku</th>
                                        <th className="pb-2 text-left font-medium w-48">Qty Resep</th>
                                        <th className="pb-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {form.data.recipe.map((item, index) => (
                                        <tr key={index}>
                                            <td className="py-2 pr-2">
                                                <Select
                                                    value={item.bahan_baku_id}
                                                    onValueChange={val => updateRecipeItem(index, 'bahan_baku_id', val)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Pilih bahan baku" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {bahanBakus.map(b => (
                                                            <SelectItem key={b.id} value={String(b.id)}>
                                                                {b.nama_bahan} ({b.satuan})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {(form.errors as any)[`recipe.${index}.bahan_baku_id`] && (
                                                    <p className="text-xs text-destructive mt-1">{(form.errors as any)[`recipe.${index}.bahan_baku_id`]}</p>
                                                )}
                                            </td>
                                            <td className="py-2 pr-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="0"
                                                    value={item.qty}
                                                    onChange={e => updateRecipeItem(index, 'qty', e.target.value)}
                                                />
                                                {(form.errors as any)[`recipe.${index}.qty`] && (
                                                    <p className="text-xs text-destructive mt-1">{(form.errors as any)[`recipe.${index}.qty`]}</p>
                                                )}
                                            </td>
                                            <td className="py-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeRecipeItem(index)}
                                                    disabled={form.data.recipe.length === 1}
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

                        {(form.errors as any)['recipe'] && (
                            <p className="text-xs text-destructive mt-2">{(form.errors as any)['recipe']}</p>
                        )}
                    </CardContent>
                </Card>

                <div className="flex gap-4 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit(products.index().url)}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => form.reset()}
                        disabled={form.processing}
                    >
                        Reset
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.processing}
                    >
                        Simpan
                    </Button>
                </div>
            </FieldGroup>
        </form>
    )
}
