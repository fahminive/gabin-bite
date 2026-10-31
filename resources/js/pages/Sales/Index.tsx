import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { Penjualan } from './column';
import { columns } from './column';
import { Button } from '@/components/ui/button';
import { Plus, Filter, X } from 'lucide-react';
import { create } from '@/actions/App/Http/Controllers/PenjualanController';

type Batch = { id: number; kode: string; keterangan: string };

interface Props {
    sales: Penjualan[];
    batches?: Batch[];
    filters?: { pre_order_id?: string | number | null };
}

export default function SalesIndex({ sales, batches = [], filters }: Props) {
    const { flash } = usePage().props as any;
    const [batchId, setBatchId] = useState<string>(String(filters?.pre_order_id ?? ''));

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    function applyFilter() {
        router.get('/sales', batchId ? { pre_order_id: batchId } : {}, { preserveState: true, preserveScroll: true });
    }

    function resetFilter() {
        setBatchId('');
        router.get('/sales', {}, { preserveState: true, preserveScroll: true });
    }

    return (
        <>
            <Head title="Daftar Pre-Order" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-2">
                    <h1 className="text-xl font-bold">Daftar Pre-Order</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={batchId}
                            onChange={e => setBatchId(e.target.value)}
                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                            aria-label="Filter batch"
                        >
                            <option value="">Semua batch</option>
                            {batches.map(batch => (
                                <option key={batch.id} value={batch.id}>
                                    {batch.kode} — {batch.keterangan}
                                </option>
                            ))}
                        </select>
                        <Button variant="outline" size="sm" onClick={applyFilter} className="h-9">
                            <Filter className="mr-1 h-4 w-4" /> Filter
                        </Button>
                        {filters?.pre_order_id && (
                            <Button variant="ghost" size="sm" onClick={resetFilter} className="h-9">
                                <X className="mr-1 h-4 w-4" /> Reset
                            </Button>
                        )}
                        <Link href={create().url}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Catat Pre-Order
                            </Button>
                        </Link>
                    </div>
                </div>

                <DataTable columns={columns} data={sales} searchKey="no_faktur" />
            </div>
        </>
    );
}
