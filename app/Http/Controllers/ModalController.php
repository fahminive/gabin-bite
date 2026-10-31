<?php

namespace App\Http\Controllers;

use App\Http\Requests\Modal\StoreModalRequest;
use App\Http\Requests\Modal\UpdateModalRequest;
use App\Models\Modal;
use Inertia\Inertia;

class ModalController extends Controller
{
    public function index()
    {
        $modals = Modal::orderBy('created_at', 'desc')->get();
        
        $totalModalMasuk = Modal::sum('nominal');
        $modalTunai = Modal::where('tipe', 'Uang Tunai')->sum('nominal');
        $modalNonTunai = Modal::where('tipe', '!=', 'Uang Tunai')->sum('nominal');

        return Inertia::render('Modal/Index', [
            'modals' => $modals,
            'metrics' => [
                'totalModalMasuk' => $totalModalMasuk,
                'modalTunai' => $modalTunai,
                'modalNonTunai' => $modalNonTunai,
            ]
        ]);
    }

    public function create()
    {
        return Inertia::render('Modal/Create');
    }

    public function store(StoreModalRequest $request)
    {
        $data = $request->validated();
        Modal::create($data);

        return redirect()->route('modals.index')->with('success', 'Setoran modal berhasil ditambahkan.');
    }

    public function edit(Modal $modal)
    {
        return Inertia::render('Modal/Create', [
            'modal' => $modal
        ]);
    }

    public function update(UpdateModalRequest $request, Modal $modal)
    {
        $data = $request->validated();
        $modal->update($data);

        return redirect()->route('modals.index')->with('success', 'Setoran modal berhasil diperbarui.');
    }

    public function destroy(Modal $modal)
    {
        $modal->delete();
        return redirect()->route('modals.index')->with('success', 'Setoran modal berhasil dihapus.');
    }
}
