import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { Pembelian } from './column';
import { columns } from './column';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ShoppingCart, Banknote, TrendingDown } from 'lucide-react';
import { create, index } from '@/actions/App/Http/Controllers/PembelianController';
import { formatRupiah } from '@/lib/utils';

interface Props {
    purchases: Pembelian[]
}

export default function PurchasesIndex({ purchases }: Props) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const totalTransaksi = purchases.length;
    const totalNilai = purchases.reduce((sum, p) => sum + Number(p.total), 0);
    const totalKredit = purchases.filter(p => p.hutang?.status === 'belum_lunas').reduce((sum, p) => sum + Number(p.total), 0);

    return (
        <>
            <Head title="Transaksi Pembelian" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-2xl p-3 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Transaksi Belanja Bahan</h1>
                        <p className="text-xs text-muted-foreground">Catatan pengeluaran pembelian bahan baku dapur</p>
                    </div>
                    <Link href={create().url} className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto rounded-xl h-9 text-xs sm:text-sm">
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Pembelian
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 mb-1">
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Total Transaksi</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-primary shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold">{totalTransaksi}</div>
                            <p className="text-[10px] text-muted-foreground">Nota belanja</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Total Belanja</CardTitle>
                            <Banknote className="h-4 w-4 text-blue-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 truncate">
                                {formatRupiah(totalNilai)}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Total uang keluar</p>
                        </CardContent>
                    </Card>
                    <Card className="col-span-2 md:col-span-1 rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Kredit Berjalan</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold text-red-600 dark:text-red-400 truncate">
                                {formatRupiah(totalKredit)}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Belanja belum lunas</p>
                        </CardContent>
                    </Card>
                </div>

                <DataTable columns={columns} data={purchases} searchKey="nama_pembelian" />
            </div>
        </>
    );
}

PurchasesIndex.layout = {
    breadcrumbs: [
        { title: 'Transaksi Pembelian', href: index() },
    ],
};
