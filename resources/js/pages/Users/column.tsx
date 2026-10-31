"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import * as users from '@/actions/App/Http/Controllers/UserController';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export type UserRow = {
  id: number
  name: string
  email: string
  role: 'admin' | 'finance' | 'owner'
  updated_at: string
}

export const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Nama Lengkap
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <span className="font-semibold text-foreground">
          {row.getValue("name")}
        </span>
      )
    }
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return <span className="text-muted-foreground">{row.getValue("email")}</span>
    }
  },
  {
    accessorKey: "role",
    header: "Role / Peran",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      if (role === 'admin') {
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50">
            Super Admin
          </Badge>
        )
      }
      if (role === 'owner') {
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
            Owner
          </Badge>
        )
      }
      return (
        <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100/80 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50">
          Finance Manager
        </Badge>
      )
    }
  },
  {
    accessorKey: "updated_at",
    header: "Tanggal Pembaruan",
    cell: ({ row }) => {
      const date = new Date(row.getValue("updated_at"))
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id;
      const { auth } = usePage().props as any;
      const isSelf = auth?.user?.id === id;

      return (
        <div className="flex items-center gap-2">
          <Link href={users.edit(id).url}>
            <Button variant="outline" size="icon" title="Edit Pengguna">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {!isSelf ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" title="Hapus Pengguna">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Akun pengguna ini akan dihapus secara permanen dari sistem.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => {
                      const action = users.destroy(id);
                      router.visit(action.url, { method: 'delete' });
                    }}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button variant="outline" size="icon" disabled title="Anda tidak dapat menghapus diri sendiri" className="opacity-50 cursor-not-allowed">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      )
    }
  },
]
