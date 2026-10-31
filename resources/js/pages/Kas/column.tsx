"use client"

import { ColumnDef } from "@tanstack/react-table"
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import * as cashAction from '@/actions/App/Http/Controllers/KasController';
import { formatRupiah } from "@/lib/utils";
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

export type KasType = {
  id: number
  kode: string
  tanggal: string
  keterangan: string | null
  masuk: string
  keluar: string
  sumber: 'pembelian' | 'penjualan' | 'hutang' | 'piutang' | 'modal' | 'peralatan' | 'operasional' | 'lainnya'
}

const getBadgeStyles = (sumber: string) => {
  switch (sumber) {
    case 'modal':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30';
    case 'operasional':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30';
    case 'pembelian':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30';
    case 'penjualan':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30';
    case 'hutang':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30';
    case 'piutang':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30';
    case 'peralatan':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/30';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900/30';
  }
}

const getSumberLabel = (sumber: string) => {
  return sumber.charAt(0).toUpperCase() + sumber.slice(1);
}

export const columns: ColumnDef<KasType>[] = [
  {
    accessorKey: "tanggal",
    header: "Tanggal",
    cell: ({ row }) => {
      if (!row.getValue("tanggal")) return "-";
      const date = new Date(row.getValue("tanggal"))
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    }
  },
  {
    accessorKey: "kode",
    header: "Kode Transaksi",
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("kode")}</span>
  },
  {
    accessorKey: "sumber",
    header: "Sumber",
    cell: ({ row }) => {
      const val = row.getValue("sumber") as string;
      return (
        <Badge className={getBadgeStyles(val)}>
          {getSumberLabel(val)}
        </Badge>
      )
    }
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
    cell: ({ row }) => row.getValue("keterangan") || "-"
  },
  {
    accessorKey: "masuk",
    header: "Uang Masuk (+)",
    cell: ({ row }) => {
      const masuk = Number(row.getValue("masuk"));
      return masuk > 0 ? (
        <span className="text-green-600 font-semibold">{formatRupiah(masuk)}</span>
      ) : "-";
    }
  },
  {
    accessorKey: "keluar",
    header: "Uang Keluar (-)",
    cell: ({ row }) => {
      const keluar = Number(row.getValue("keluar"));
      return keluar > 0 ? (
        <span className="text-red-600 font-semibold">{formatRupiah(keluar)}</span>
      ) : "-";
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id;
      const isManual = row.original.sumber === 'lainnya';

      if (!isManual) return null;

      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Penyesuaian Kas?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Catatan penyesuaian kas manual ini akan dihapus permanen dari sistem.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  const action = cashAction.destroy(id);
                  router.visit(action.url, { method: 'delete' });
                }}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }
  },
]
