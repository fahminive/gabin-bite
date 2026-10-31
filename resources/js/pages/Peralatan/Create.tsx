import { Head } from '@inertiajs/react';
import { PeralatanForm } from './createForm';
import * as equipments from '@/actions/App/Http/Controllers/PeralatanController';

export default function PeralatanCreate({ peralatan, defaultKode }: { peralatan?: any, defaultKode?: string }) {
    const isEdit = !!peralatan;
    return (
        <>
            <Head title={isEdit ? "Edit Peralatan" : "Tambah Peralatan"} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <PeralatanForm peralatan={peralatan} defaultKode={defaultKode} />
            </div>
        </>
    );
}

PeralatanCreate.layout = {
    breadcrumbs: [
        {
            title: 'Peralatan',
            href: equipments.index(),
        },
    ],
};
