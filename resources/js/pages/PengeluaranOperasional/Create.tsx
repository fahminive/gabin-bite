import { Head } from '@inertiajs/react';
import { ExpenseForm } from './createForm';
import * as expensesAction from '@/actions/App/Http/Controllers/PengeluaranOperasionalController';

export default function ExpenseCreate({ expense }: { expense?: any }) {
    const isEdit = !!expense;
    return (
        <>
            <Head title={isEdit ? "Edit Biaya Operasional" : "Catat Biaya Operasional"} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <ExpenseForm expense={expense} />
            </div>
        </>
    );
}

ExpenseCreate.layout = {
    breadcrumbs: [
        {
            title: 'Biaya Operasional',
            href: expensesAction.index(),
        },
    ],
};
