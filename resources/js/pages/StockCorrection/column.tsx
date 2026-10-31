"use client"

import { ColumnDef } from "@tanstack/react-table"
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowUpDown } from 'lucide-react';
import * as stockCorrections from '@/actions/App/Http/Controllers/KoreksiStokController';
import { Badge } from "@/components/ui/badge";
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

export type KoreksiStok = {
  id: number
  tanggal: string
  produk_id: number
  jenis_koreksi: 'masuk' | 'keluar'
  qty: number
  keterangan: string
  produk: {
    nama_produk: string
    satuan: string
  }
}

export const columns: ColumnDef<KoreksiStok>[] = [
  {
    accessorKey: "tanggal",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Tanggal
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("tanggal"))
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    }
  },
  {
    id: "produk",
    header: "Produk",
    cell: ({ row }) => {
      const prod = row.original.produk;
      return prod ? `${prod.nama_produk}` : "-";
    }
  },
  {
    accessorKey: "jenis_koreksi",
    header: "Jenis Penyesuaian",
    cell: ({ row }) => {
      const type = row.getValue("jenis_koreksi") as 'masuk' | 'keluar';
      if (type === 'masuk') {
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            Koreksi Masuk
          </Badge>
        )
      }
      return (
        <Badge variant="destructive">
          Koreksi Keluar
        </Badge>
      )
    }
  },
  {
    accessorKey: "qty",
    header: "Qty Koreksi",
    cell: ({ row }) => {
      const qty = row.original.qty;
      const type = row.original.jenis_koreksi;
      const satuan = row.original.produk?.satuan ?? '';
      const prefix = type === 'masuk' ? '+' : '-';
      const colorClass = type === 'masuk' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
      return (
        <span className={`font-semibold ${colorClass}`}>
          {prefix} {qty} {satuan}
        </span>
      );
    }
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan / Alasan",
    cell: ({ row }) => row.getValue("keterangan") || "-"
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Batalkan / Hapus Koreksi Stok?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Kuantitas stok produk yang telah disesuaikan akan dikembalikan ke keadaan semula secara otomatis.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    const action = stockCorrections.destroy(id);
                    router.visit(action.url, { method: 'delete' });
                  }}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  Hapus / Batalkan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  },
]
