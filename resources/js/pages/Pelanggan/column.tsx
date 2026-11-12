'use client';

import { Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import * as customers from '@/actions/App/Http/Controllers/PelangganController';
import {
    DeliveryBadge,
    OrderStatusDialog,
    PaymentBadge,
} from '@/components/order-status-dialog';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export type Pelanggan = {
    id: number;
    kode: string;
    nama_pelanggan: string;
    updated_at: string;
    penjualans?: {
        id: number;
        no_faktur: string;
        total: number;
        status: string;
        status_pembayaran: 'belum_bayar' | 'sudah_bayar';
        status_penyerahan: 'belum_diberikan' | 'sudah_diberikan';
        tanggal_bayar?: string | null;
        tanggal_diberikan?: string | null;
        pre_order?: { keterangan: string; kode: string } | null;
    }[];
};

export const columns: ColumnDef<Pelanggan>[] = [
    {
        accessorKey: 'kode',
        header: 'Kode',
    },
    {
        accessorKey: 'nama_pelanggan',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                    className="-ml-4"
                >
                    Nama Pelanggan
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: 'updated_at',
        header: 'Tanggal Update',
        cell: ({ row }) => {
            const date = new Date(row.getValue('updated_at'));

            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        },
    },
    {
        id: 'status_pre_order',
        header: 'Status Pesanan',
        cell: ({ row }) => {
            const orders = row.original.penjualans ?? [];

            if (orders.length === 0) {
                return (
                    <span className="text-muted-foreground">
                        Belum ada pre-order
                    </span>
                );
            }

            return (
                <div className="flex flex-col gap-2">
                    {orders.slice(0, 3).map((order) => (
                        <div
                            key={order.id}
                            className="rounded-md border p-2 text-xs"
                        >
                            <div className="mb-1 flex items-center justify-between gap-2">
                                <span className="font-medium">
                                    {order.pre_order
                                        ? `${order.pre_order.kode} - ${order.pre_order.keterangan}`
                                        : order.no_faktur}
                                </span>
                                <OrderStatusDialog sale={order} label="Ubah" />
                            </div>
                            <div className="flex flex-wrap gap-1">
                                <PaymentBadge
                                    status={order.status_pembayaran}
                                />
                                <DeliveryBadge
                                    status={order.status_penyerahan}
                                />
                            </div>
                        </div>
                    ))}
                    {orders.length > 3 && (
                        <span className="text-[11px] text-muted-foreground">
                            +{orders.length - 3} pesanan lain
                        </span>
                    )}
                </div>
            );
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const id = row.original.id;

            return (
                <div className="flex items-center gap-2">
                    <Link href={customers.edit(id).url}>
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
                                <AlertDialogTitle>
                                    Hapus Pelanggan?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tindakan ini tidak dapat dibatalkan. Data
                                    pelanggan ini akan dihapus permanen dari
                                    sistem beserta riwayat transaksi terkait
                                    jika ada.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        const action = customers.destroy(id);
                                        router.visit(action.url, {
                                            method: 'delete',
                                        });
                                    }}
                                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                >
                                    Hapus
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            );
        },
    },
];
