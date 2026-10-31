"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import * as suppliers from '@/actions/App/Http/Controllers/PemasokController';
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

export type Pemasok = {
  id: number
  kode: string
  nama_pemasok: string
  no_telepon: string | null
  alamat: string | null
  keterangan: string | null
  updated_at: string
}

export const columns: ColumnDef<Pemasok>[] = [
  {
    accessorKey: "kode",
    header: "Kode",
  },
  {
    accessorKey: "nama_pemasok",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Nama Pemasok
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "no_telepon",
    header: "No. Telepon",
    cell: ({ row }) => row.getValue("no_telepon") || "-",
  },
  {
    accessorKey: "alamat",
    header: "Alamat",
    cell: ({ row }) => {
      const val = row.getValue("alamat") as string | null
      return val ? (
        <div className="max-w-[200px] truncate" title={val}>
          {val}
        </div>
      ) : "-"
    },
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
    cell: ({ row }) => {
      const val = row.getValue("keterangan") as string | null
      return val ? (
        <div className="max-w-[200px] truncate" title={val}>
          {val}
        </div>
      ) : "-"
    },
  },
  {
    accessorKey: "updated_at",
    header: "Tanggal Update",
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
      return (
        <div className="flex items-center gap-2">
          <Link href={suppliers.edit(id).url}>
            <Button variant="outline" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Pemasok?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Data pemasok ini akan dihapus permanen dari sistem beserta riwayat pembelian terkait jika ada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    const action = suppliers.destroy(id);
                    router.visit(action.url, { method: 'delete' });
                  }}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  },
]
