import { Head } from '@inertiajs/react';
import { PelangganForm } from './createForm';
import * as customers from '@/actions/App/Http/Controllers/PelangganController';

export default function PelangganCreate({ pelanggan, defaultKode }: { pelanggan?: any, defaultKode?: string }) {
    const isEdit = !!pelanggan;
    return (
        <>
            <Head title={isEdit ? "Edit Pelanggan" : "Tambah Pelanggan"} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <PelangganForm pelanggan={pelanggan} defaultKode={defaultKode} />
            </div>
        </>
    );
}

PelangganCreate.layout = {
    breadcrumbs: [
        {
            title: 'Pelanggan',
            href: customers.index(),
        },
    ],
};
