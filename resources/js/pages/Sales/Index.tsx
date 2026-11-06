import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { Penjualan } from './column';
import { columns } from './column';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { create, index } from '@/actions/App/Http/Controllers/PenjualanController';
import { BatchFilter, type BatchOption } from '@/components/batch-filter';

interface Props {
    sales: Penjualan[];
    batches?: BatchOption[];
    filters?: { pre_order_id?: string | number | null };
}

export default function SalesIndex({ sales, batches = [], filters }: Props) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <>
            <Head title="Daftar Pre-Order" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-2">
                    <h1 className="text-xl font-bold">Daftar Pre-Order</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <BatchFilter
                            batches={batches}
                            value={filters?.pre_order_id}
                            url={index().url}
                        />
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
