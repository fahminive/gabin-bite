import { Head } from '@inertiajs/react';
import { UserForm } from './createForm';
import * as users from '@/actions/App/Http/Controllers/UserController';

export default function UsersCreate({ userModel }: { userModel?: any }) {
    const isEdit = !!userModel;
    return (
        <>
            <Head title={isEdit ? "Edit Pengguna" : "Tambah Pengguna"} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <UserForm userModel={userModel} />
            </div>
        </>
    );
}

UsersCreate.layout = {
    breadcrumbs: [
        {
            title: 'Pengguna',
            href: users.index(),
        },
    ],
};
