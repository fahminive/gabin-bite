"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import * as equipments from '@/actions/App/Http/Controllers/PeralatanController';
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

export type Peralatan = {
  id: number
  kode: string
  nama_alat: string
  harga_perolehan: string
  tgl_beli: string
  umur_ekonomis: number
  persentase_penyusutan: string
  status_alat: 'layak_pakai' | 'tidak_layak_pakai'
  updated_at: string
}

export const columns: ColumnDef<Peralatan>[] = [
  {
    accessorKey: "kode",
    header: "Kode",
  },
  {
    accessorKey: "nama_alat",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Nama Alat
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "harga_perolehan",
    header: "Harga Perolehan",
    cell: ({ row }) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(row.getValue("harga_perolehan")))
    }
  },
  {
    accessorKey: "tgl_beli",
    header: "Tanggal Beli",
    cell: ({ row }) => {
      const date = new Date(row.getValue("tgl_beli"))
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    }
  },
  {
    accessorKey: "umur_ekonomis",
    header: "Umur Ekonomis",
    cell: ({ row }) => `${row.getValue("umur_ekonomis")} Bulan`,
  },
  {
    accessorKey: "persentase_penyusutan",
    header: "Penyusutan",
    cell: ({ row }) => `${row.getValue("persentase_penyusutan")} %/bln`,
  },
  {
    accessorKey: "status_alat",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status_alat") as string;
      return status === "layak_pakai" ? (
        <Badge variant="default" className="bg-green-600 hover:bg-green-600 dark:bg-green-600 text-white">
          Layak Pakai
        </Badge>
      ) : (
        <Badge variant="destructive">
          Tidak Layak Pakai
        </Badge>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div className="flex items-center gap-2">
          <Link href={equipments.edit(id).url}>
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
                <AlertDialogTitle>Hapus Peralatan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Data peralatan ini akan dihapus permanen dari sistem beserta riwayat penyusutan/transaksi terkait.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    const action = equipments.destroy(id);
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
