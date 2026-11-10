"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowUpDown, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import * as products from '@/actions/App/Http/Controllers/ProdukController';
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

export type Produk = {
  id: number
  kode: string
  nama_produk: string
  stok: number
  hpp: number
  harga_jual: string
  satuan: string
  updated_at: string
  terjual_seumur_hidup?: number
  belum_diserahkan?: number
}

export const columns: ColumnDef<Produk>[] = [
  {
    accessorKey: "kode",
    header: "Kode",
  },
  {
    accessorKey: "nama_produk",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Nama Produk
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "stok",
    header: "Stok",
    cell: ({ row }) => {
      return `${row.original.stok} ${row.original.satuan}`
    }
  },
  {
    accessorKey: "terjual_seumur_hidup",
    header: "Terjual ⏳",
    cell: ({ row }) => {
      const v = row.original.terjual_seumur_hidup ?? 0
      return <span className="font-semibold text-emerald-600 dark:text-emerald-400">{v}</span>
    }
  },
  {
    accessorKey: "belum_diserahkan",
    header: "Belum diserahkan",
    cell: ({ row }) => {
      const v = row.original.belum_diserahkan ?? 0
      return v > 0
        ? <Badge variant="outline" className="text-amber-600 dark:text-amber-400">{v}</Badge>
        : <span className="text-muted-foreground">0</span>
    }
  },
  {
    accessorKey: "hpp",
    header: "HPP",
    cell: ({ row }) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(row.original.hpp)
    }
  },
  {
    accessorKey: "harga_jual",
    header: "Harga Jual",
    cell: ({ row }) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(row.original.harga_jual))
    }
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
          <Link href={products.edit(id).url}>
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
                <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Data produk ini akan dihapus permanen dari sistem.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    const action = products.destroy(id);
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
