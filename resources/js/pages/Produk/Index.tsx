import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { Produk } from './column';
import { columns } from './column';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Package, PackageOpen, CircleDollarSign, ShoppingBag, Timer } from 'lucide-react';
import { create } from '@/actions/App/Http/Controllers/ProdukController';

export default function ProdukIndex({ user, products, terjualSeumurHidup = 0, belumDiserahkan = 0 }: { user: string, products: Produk[], terjualSeumurHidup?: number, belumDiserahkan?: number }) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const nf = (v: number) =>
        new Intl.NumberFormat('id-ID').format(v);
    const totalProduk = products.length;
    const totalStok = products.reduce((sum, item) => sum + Number(item.stok), 0);
    const totalNilai = products.reduce((sum, item) => sum + (Number(item.stok) * Number(item.harga_jual)), 0);

    return (
        <>
            <Head title="Produk Jadi" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-2xl p-3 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{user}</h1>
                        <p className="text-xs text-muted-foreground">Katalog varian dan stok gabin siap jual</p>
                    </div>
                    <Link href={create().url} className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto rounded-xl h-9 text-xs sm:text-sm">
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Produk
                        </Button>
                    </Link>
                </div>
                
                <div className="grid gap-2.5 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-1">
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Terjual Seumur Hidup</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-emerald-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{nf(terjualSeumurHidup)}</div>
                            <p className="text-[10px] text-muted-foreground">Bungkus sudah diserahkan</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Belum Diserahkan</CardTitle>
                            <Timer className="h-4 w-4 text-amber-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">{nf(belumDiserahkan)}</div>
                            <p className="text-[10px] text-muted-foreground">Pesanan menunggu serah terima</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Total Varian</CardTitle>
                            <Package className="h-4 w-4 text-primary shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold">{totalProduk}</div>
                            <p className="text-[10px] text-muted-foreground">Varian aktif</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Total Stok</CardTitle>
                            <PackageOpen className="h-4 w-4 text-amber-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">{totalStok}</div>
                            <p className="text-[10px] text-muted-foreground">Pcs di etalase</p>
                        </CardContent>
                    </Card>
                    <Card className="col-span-2 md:col-span-1 rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Estimasi Nilai Jual</CardTitle>
                            <CircleDollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalNilai)}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Total potensi omset</p>
                        </CardContent>
                    </Card>
                </div>

                <DataTable columns={columns} data={products} searchKey="nama_produk" />
            </div>
        </>
    );
}
