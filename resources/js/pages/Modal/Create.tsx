import { Head } from '@inertiajs/react';
import { ModalForm } from './createForm';
import * as modalsAction from '@/actions/App/Http/Controllers/ModalController';

export default function ModalCreate({ modal }: { modal?: any }) {
    const isEdit = !!modal;
    return (
        <>
            <Head title={isEdit ? "Edit Setoran Modal" : "Tambah Setoran Modal"} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <ModalForm modal={modal} />
            </div>
        </>
    );
}

ModalCreate.layout = {
    breadcrumbs: [
        {
            title: 'Setoran Modal',
            href: modalsAction.index(),
        },
    ],
};
