import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { BahanBakuForm } from './createForm';
import * as materials from '@/actions/App/Http/Controllers/BahanBakuController';

export default function BahanBakuCreate({ bahanBaku, defaultKode }: { bahanBaku?: any, defaultKode?: string }) {
    const isEdit = !!bahanBaku;
    return (
        <>
            <Head title={isEdit ? "Edit Bahan Baku" : "Tambah Bahan Baku"} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <BahanBakuForm bahanBaku={bahanBaku} defaultKode={defaultKode} />
                {/* <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <BahanBakuForm/>
                </div> */}
            </div>
        </>
    );
}

BahanBakuCreate.layout = {
    breadcrumbs: [
        {
            title: 'Tambah Bahan Baku',
            href: materials.index(),
        },
    ],
};
