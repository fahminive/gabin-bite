import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { Pelanggan } from './column';
import { columns } from './column';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, PhoneCall } from 'lucide-react';
import { create } from '@/actions/App/Http/Controllers/PelangganController';

export default function PelangganIndex({ customers }: { customers: Pelanggan[] }) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const totalPelanggan = customers.length;

    return (
        <>
            <Head title="Daftar Pelanggan" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-2xl p-3 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Data Pelanggan</h1>
                        <p className="text-xs text-muted-foreground">Kelola pelanggan dan pembeli setia Gabin Bite</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link href={create().url} className="w-full sm:w-auto">
                            <Button className="w-full rounded-xl h-9 text-xs sm:text-sm">
                                <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Pelanggan
                            </Button>
                        </Link>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-1">
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Total Pelanggan</CardTitle>
                            <Users className="h-4 w-4 text-primary shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold">{totalPelanggan}</div>
                            <p className="text-[10px] text-muted-foreground">Terdaftar di sistem</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Kategori Aktif</CardTitle>
                            <PhoneCall className="h-4 w-4 text-emerald-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalPelanggan}</div>
                            <p className="text-[10px] text-muted-foreground">Siap dipakai transaksi</p>
                        </CardContent>
                    </Card>
                </div>

                <DataTable columns={columns} data={customers} searchKey="nama_pelanggan" />
            </div>
        </>
    );
}
