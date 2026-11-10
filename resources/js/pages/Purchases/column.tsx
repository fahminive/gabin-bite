"use client"

import { ColumnDef } from "@tanstack/react-table"
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowUpDown, BadgeCheck, Clock, Eye } from 'lucide-react';
import * as purchases from '@/actions/App/Http/Controllers/PembelianController';
import { formatRupiah } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export type Pembelian = {
  id: number
  nama_pembelian: string
  total: number
  created_at: string
  pemasok: { nama_pemasok: string } | null
  mitra: { nama: string; kode: string } | null
  pre_order: { kode: string; keterangan: string } | null
  sumber_dana: 'pribadi' | 'simpanan_usaha'
  hutang: { status: 'lunas' | 'belum_lunas' } | null
  detail_pembelians: {
    qty: number;
    satuan: string;
    bahan_baku?: { nama_bahan: string }
  }[]
}

export const columns: ColumnDef<Pembelian>[] = [
  {
    accessorKey: "created_at",
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
      const date = new Date(row.getValue("created_at"))
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    }
  },
  {
    accessorKey: "nama_pembelian",
    header: "Nama Pembelian",
  },
  {
    id: "pemasok",
    header: "Pemasok",
    cell: ({ row }) => row.original.pemasok?.nama_pemasok ?? "-"
  },
  {
    id: "partner",
    header: "Dibayar Oleh / Split Bill",
    cell: ({ row }) => row.original.sumber_dana === 'pribadi'
      ? <div><div>{row.original.mitra?.nama ?? 'Partner tidak diketahui'}</div><Badge variant="outline">Masuk Split Bill</Badge></div>
      : <div><div>Simpanan Usaha</div><Badge variant="secondary">Tanpa Split Bill</Badge></div>
  },
  {
    id: "batch",
    header: "Batch Pre-Order",
    cell: ({ row }) => row.original.pre_order ? `${row.original.pre_order.kode} - ${row.original.pre_order.keterangan}` : "-"
  },
  {
    id: "items",
    header: "Bahan Baku Dibeli",
    cell: ({ row }) => {
      const items = row.original.detail_pembelians || [];
      if (items.length === 0) return "-";

      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
              <Eye className="mr-2 h-3 w-3" />
              {items.length} Jenis
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Detail Bahan Baku Dibeli</DialogTitle>
              <DialogDescription>
                Rincian bahan baku dari transaksi {row.original.nama_pembelian}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mt-2 max-h-[60vh] overflow-y-auto pr-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b pb-2 text-sm">
                  <span className="font-medium">{item.bahan_baku?.nama_bahan ?? 'Bahan Baku'}</span>
                  <Badge variant="secondary" className="font-bold">{item.qty} {item.satuan ?? ''}</Badge>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      );
    }
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => formatRupiah(row.getValue("total"))
  },
  {
    id: "jenis",
    header: "Jenis Pembayaran",
    cell: ({ row }) => {
      const hutang = row.original.hutang;
      if (!hutang) {
        return <Badge variant="secondary">Tunai</Badge>
      }
      if (hutang.status === 'lunas') {
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 gap-1">
            <BadgeCheck className="h-3 w-3" /> Kredit (Lunas)
          </Badge>
        )
      }
      return (
        <Badge variant="destructive" className="gap-1">
          <Clock className="h-3 w-3" /> Kredit (Berjalan)
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Transaksi Pembelian?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Stok bahan baku yang bertambah dari pembelian ini akan dikembalikan, dan catatan kas atau hutang yang terkait akan dihapus otomatis.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    const action = purchases.destroy(id);
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
