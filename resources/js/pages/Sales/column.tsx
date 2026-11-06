"use client"

import { ColumnDef } from "@tanstack/react-table"
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowUpDown, BadgeCheck, Eye } from 'lucide-react';
import * as sales from '@/actions/App/Http/Controllers/PenjualanController';
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DeliveryBadge, OrderStatusDialog, PaymentBadge } from '@/components/order-status-dialog';
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

export type Penjualan = {
  id: number
  no_faktur: string
  status: 'draft' | 'diproses' | 'siap' | 'selesai'
  status_pembayaran: 'belum_bayar' | 'sudah_bayar'
  status_penyerahan: 'belum_diberikan' | 'sudah_diberikan'
  nama_lengkap?: string | null
  tanggal_bayar?: string | null
  tanggal_diberikan?: string | null
  total: number
  created_at: string
  pelanggan: { nama_pelanggan: string } | null
  pre_order?: { kode: string; keterangan: string } | null
  detail_penjualans: { 
    qty: number;
    produk?: { nama_produk: string; satuan: string }
  }[]
}

export const columns: ColumnDef<Penjualan>[] = [
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
        day: "2-digit",
        month: "short"
      })
    }
  },
  {
    accessorKey: "no_faktur",
    header: "No. Faktur",
  },
  {
    id: "pelanggan",
    meta: { className: "hidden md:table-cell" },
    header: "Pelanggan",
    cell: ({ row }) => row.original.nama_lengkap || row.original.pelanggan?.nama_pelanggan || "-"
  },
  {
    id: "items",
    meta: { className: "hidden lg:table-cell" },
    header: "Produk Terjual",
    cell: ({ row }) => {
      const items = row.original.detail_penjualans || [];
      const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
      if (items.length === 0) return "-";
      
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
              <Eye className="mr-2 h-3 w-3" />
              {items.length} Varian ({totalQty} Item)
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Detail Produk Terjual</DialogTitle>
              <DialogDescription>
                Rincian produk jadi pada faktur {row.original.no_faktur}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mt-2 max-h-[60vh] overflow-y-auto pr-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b pb-2 text-sm">
                  <span className="font-medium">{item.produk?.nama_produk ?? 'Produk'}</span>
                  <Badge variant="secondary" className="font-bold">{item.qty} {item.produk?.satuan ?? ''}</Badge>
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
    id: "batch",
    meta: { className: "hidden lg:table-cell" },
    header: "Batch",
    cell: ({ row }) => row.original.pre_order
      ? `${row.original.pre_order.kode} — ${row.original.pre_order.keterangan}`
      : "-"
  },
  {
    id: "status_pembayaran",
    header: "Pembayaran",
    cell: ({ row }) => <PaymentBadge status={row.original.status_pembayaran} />
  },
  {
    id: "status_penyerahan",
    meta: { className: "hidden sm:table-cell" },
    header: "Penyerahan",
    cell: ({ row }) => <DeliveryBadge status={row.original.status_penyerahan} />
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sale = row.original;
      return (
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusDialog sale={sale} />

          {sale.status_penyerahan !== 'sudah_diberikan' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-medium border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              onClick={() => {
                router.post(`/sales/${sale.id}/fulfill`);
              }}
            >
              <BadgeCheck className="mr-1 h-3.5 w-3.5 text-emerald-600" /> Serahkan Pesanan
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Pesanan Pre-Order?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Jika pesanan sudah diserahkan, kuantitas stok produk jadi akan dikembalikan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    const action = sales.destroy(sale.id);
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
