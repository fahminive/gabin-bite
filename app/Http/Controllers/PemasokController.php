<?php

namespace App\Http\Controllers;

use App\Http\Requests\Pemasok\StorePemasokRequest;
use App\Http\Requests\Pemasok\UpdatePemasokRequest;
use App\Models\Pemasok;
use Inertia\Inertia;

class PemasokController extends Controller
{
    public function index()
    {
        $suppliers = Pemasok::orderBy('kode', 'asc')->get();
        return Inertia::render('Pemasok/Index', [
            'suppliers' => $suppliers
        ]);
    }

    public function create()
    {
        return Inertia::render('Pemasok/Create', [
            'defaultKode' => $this->generateKode()
        ]);
    }

    private function generateKode() {
        $lastRecord = Pemasok::orderBy('id', 'desc')->first();
        $nextId = 1;
        if ($lastRecord && preg_match('/-(\d+)$/', $lastRecord->kode, $matches)) {
            $nextId = intval($matches[1]) + 1;
        } elseif ($lastRecord) {
            $nextId = $lastRecord->id + 1;
        }
        return 'SPL-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    public function store(StorePemasokRequest $request)
    {
        $data = $request->validated();
        Pemasok::create($data);

        return redirect()->route('suppliers.index')->with('success', 'Pemasok berhasil ditambahkan.');
    }

    public function edit(Pemasok $supplier)
    {
        return Inertia::render('Pemasok/Create', [
            'pemasok' => $supplier
        ]);
    }

    public function update(UpdatePemasokRequest $request, Pemasok $supplier)
    {
        $data = $request->validated();
        $supplier->update($data);

        return redirect()->route('suppliers.index')->with('success', 'Pemasok berhasil diperbarui.');
    }

    public function destroy(Pemasok $supplier)
    {
        $supplier->delete();
        return redirect()->route('suppliers.index')->with('success', 'Pemasok berhasil dihapus.');
    }
}
