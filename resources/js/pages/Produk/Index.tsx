import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { Produk } from './column';
import { columns } from './column';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, PackageOpen, CircleDollarSign, ShoppingBag, Timer } from 'lucide-react';
import { create } from '@/actions/App/Http/Controllers/ProdukController';

interface TerjualVarian {
    produk_id: number;
    kode: string;
    nama_produk: string;
    satuan: string;
    qty_terjual: number;
    nilai_terjual: number;
}

export default function ProdukIndex({ user, products, terjualSeumurHidup = 0, belumDiserahkan = 0, terjualPerVarian = [] }: { user: string, products: Produk[], terjualSeumurHidup?: number, belumDiserahkan?: number, terjualPerVarian?: TerjualVarian[] }) {
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
                
                <div className="grid gap-2.5 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-1">
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
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Total Stok</CardTitle>
                            <PackageOpen className="h-4 w-4 text-primary shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold">{nf(totalStok)}</div>
                            <p className="text-[10px] text-muted-foreground">Pcs di etalase</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-3.5 sm:p-4">
                            <CardTitle className="text-xs sm:text-sm font-extrabold text-muted-foreground truncate">Estimasi Nilai Jual</CardTitle>
                            <CircleDollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
                        </CardHeader>
                        <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalNilai)}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Total potensi omset</p>
                        </CardContent>
                    </Card>
                </div>

                <DataTable columns={columns} data={products} searchKey="nama_produk" />

                {/* Detail terjual per varian (seumur hidup) */}
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                            <ShoppingBag className="h-4 w-4 text-emerald-500" />
                            Detail Terjual per Varian
                            <span className="text-xs font-normal text-muted-foreground">
                                seumur hidup, basis serah terima ke pembeli
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        {terjualPerVarian.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada penjualan yang diserahkan.
                            </p>
                        ) : (
                            <>
                                {/* Mobile: baris ringkas per varian */}
                                <div className="flex flex-col divide-y md:hidden">
                                    {terjualPerVarian.map((v) => (
                                        <div key={v.produk_id} className="flex items-center justify-between gap-2 py-2.5">
                                            <span className="min-w-0 truncate text-sm font-medium">
                                                {v.nama_produk}
                                                <span className="ml-1.5 text-xs text-muted-foreground">{v.kode}</span>
                                            </span>
                                            <span className="shrink-0 text-right text-sm">
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {nf(v.qty_terjual)} {v.satuan}
                                                </span>
                                                <span className="block text-[11px] text-muted-foreground">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v.nilai_terjual)}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between py-2.5 font-bold">
                                        <span className="text-sm">Total</span>
                                        <span className="text-right text-sm">
                                            <span className="text-emerald-600 dark:text-emerald-400">{nf(terjualSeumurHidup)}</span>
                                            <span className="block text-[11px] font-medium text-muted-foreground">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                                                    terjualPerVarian.reduce((sum, v) => sum + Number(v.nilai_terjual), 0),
                                                )}
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {/* Desktop: tabel */}
                                <div className="hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[420px] text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs text-muted-foreground">
                                            <th className="pb-2 pr-3 font-semibold">Varian</th>
                                            <th className="pb-2 pr-3 text-right font-semibold">Terjual</th>
                                            <th className="pb-2 text-right font-semibold">Nilai Terjual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {terjualPerVarian.map((v) => (
                                            <tr key={v.produk_id}>
                                                <td className="py-2 pr-3 font-medium">
                                                    {v.nama_produk}
                                                    <span className="ml-1.5 text-xs text-muted-foreground">
                                                        {v.kode}
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {nf(v.qty_terjual)} {v.satuan}
                                                </td>
                                                <td className="py-2 text-right">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v.nilai_terjual)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t font-bold">
                                            <td className="py-2 pr-3">Total</td>
                                            <td className="py-2 pr-3 text-right text-emerald-600 dark:text-emerald-400">
                                                {nf(terjualSeumurHidup)}
                                            </td>
                                            <td className="py-2 text-right">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                                                    terjualPerVarian.reduce((sum, v) => sum + Number(v.nilai_terjual), 0),
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
