import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { MetodePembayaran } from './column';
import { columns } from './column';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { create } from '@/actions/App/Http/Controllers/MetodePembayaranController';

export default function MetodePembayaranIndex({ paymentMethods }: { paymentMethods: MetodePembayaran[] }) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const totalMetode = paymentMethods.length;
    const tunaiCount = paymentMethods.filter(item => 
        item.nama_metode.toLowerCase().includes('tunai') || 
        item.nama_metode.toLowerCase().includes('cash')
    ).length;
    const nonTunaiCount = totalMetode - tunaiCount;

    return (
        <>
            <Head title="Daftar Metode Pembayaran" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between gap-4 mb-2">
                    <h1 className="text-xl font-bold">Data Metode Pembayaran</h1>
                    <Link href={create().url}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Tambah Metode
                        </Button>
                    </Link>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3 mb-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Metode</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalMetode}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Metode Tunai / Cash</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{tunaiCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Metode Non-Tunai / Transfer</CardTitle>
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{nonTunaiCount}</div>
                        </CardContent>
                    </Card>
                </div>

                <DataTable columns={columns} data={paymentMethods} searchKey="nama_metode" />
            </div>
        </>
    );
}
