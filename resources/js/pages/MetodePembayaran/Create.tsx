import { Head } from '@inertiajs/react';
import { MetodePembayaranForm } from './createForm';
import * as paymentMethods from '@/actions/App/Http/Controllers/MetodePembayaranController';

export default function MetodePembayaranCreate({ paymentMethod, defaultKode }: { paymentMethod?: any, defaultKode?: string }) {
    const isEdit = !!paymentMethod;
    return (
        <>
            <Head title={isEdit ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran"} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <MetodePembayaranForm paymentMethod={paymentMethod} defaultKode={defaultKode} />
            </div>
        </>
    );
}

MetodePembayaranCreate.layout = {
    breadcrumbs: [
        {
            title: 'Metode Pembayaran',
            href: paymentMethods.index(),
        },
    ],
};
