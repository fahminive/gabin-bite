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
import * as usersAction from "@/actions/App/Http/Controllers/UserController"

interface Props {
    userModel?: {
        id: number
        name: string
        email: string
        role: 'admin' | 'finance' | 'owner'
    }
}

export function UserForm({
    userModel
}: Props) {
    const isEdit = !!userModel

    const form = useForm({
        name: userModel?.name ?? "",
        email: userModel?.email ?? "",
        role: userModel?.role ?? "finance",
        password: "",
        password_confirmation: "",
    })

    function submit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault()

        const action = isEdit
            ? usersAction.update(userModel.id)
            : usersAction.store()

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
                    <FieldLabel htmlFor="name">
                        Nama Lengkap
                    </FieldLabel>

                    <Input
                        id="name"
                        placeholder="Contoh: Muhammad Ali"
                        value={form.data.name}
                        onChange={(e) =>
                            form.setData(
                                "name",
                                e.target.value
                            )
                        }
                    />

                    {form.errors.name && (
                        <FieldError>
                            {form.errors.name}
                        </FieldError>
                    )}
                </Field>

                <Field>
                    <FieldLabel htmlFor="email">
                        Alamat Email
                    </FieldLabel>

                    <Input
                        id="email"
                        type="email"
                        placeholder="Contoh: partner@gabinbite.pwt"
                        value={form.data.email}
                        onChange={(e) =>
                            form.setData(
                                "email",
                                e.target.value
                            )
                        }
                    />

                    {form.errors.email && (
                        <FieldError>
                            {form.errors.email}
                        </FieldError>
                    )}
                </Field>

                <Field>
                    <FieldLabel htmlFor="role">
                        Peran / Role
                    </FieldLabel>

                    <Select
                        value={form.data.role}
                        onValueChange={(val) =>
                            form.setData(
                                "role",
                                val as 'admin' | 'finance' | 'owner'
                            )
                        }
                    >
                        <SelectTrigger id="role" className="w-full">
                            <SelectValue placeholder="Pilih peran pengguna" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">
                                Super Admin
                            </SelectItem>
                            <SelectItem value="finance">
                                Finance Manager
                            </SelectItem>
                            <SelectItem value="owner">
                                Owner
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {form.errors.role && (
                        <FieldError>
                            {form.errors.role}
                        </FieldError>
                    )}
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">
                        Kata Sandi {isEdit && <span className="text-xs font-normal text-muted-foreground">(Kosongkan jika tidak diubah)</span>}
                    </FieldLabel>

                    <Input
                        id="password"
                        type="password"
                        placeholder={isEdit ? "Masukkan kata sandi baru" : "Masukkan kata sandi"}
                        value={form.data.password}
                        onChange={(e) =>
                            form.setData(
                                "password",
                                e.target.value
                            )
                        }
                    />

                    {form.errors.password && (
                        <FieldError>
                            {form.errors.password}
                        </FieldError>
                    )}
                </Field>

                <Field>
                    <FieldLabel htmlFor="password_confirmation">
                        Konfirmasi Kata Sandi
                    </FieldLabel>

                    <Input
                        id="password_confirmation"
                        type="password"
                        placeholder={isEdit ? "Konfirmasi kata sandi baru" : "Ulangi kata sandi"}
                        value={form.data.password_confirmation}
                        onChange={(e) =>
                            form.setData(
                                "password_confirmation",
                                e.target.value
                            )
                        }
                    />

                    {form.errors.password_confirmation && (
                        <FieldError>
                            {form.errors.password_confirmation}
                        </FieldError>
                    )}
                </Field>

                <div className="flex gap-4 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit(usersAction.index().url)}
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
