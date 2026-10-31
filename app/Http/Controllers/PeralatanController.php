<?php

namespace App\Http\Controllers;

use App\Http\Requests\Peralatan\StorePeralatanRequest;
use App\Http\Requests\Peralatan\UpdatePeralatanRequest;
use App\Models\Peralatan;
use Inertia\Inertia;

class PeralatanController extends Controller
{
    public function index()
    {
        $equipment = Peralatan::orderBy('kode', 'asc')->get();
        return Inertia::render('Peralatan/Index', [
            'equipment' => $equipment
        ]);
    }

    public function create()
    {
        return Inertia::render('Peralatan/Create', [
            'defaultKode' => $this->generateKode()
        ]);
    }

    private function generateKode() {
        $lastRecord = Peralatan::orderBy('id', 'desc')->first();
        $nextId = 1;
        if ($lastRecord && preg_match('/-(\d+)$/', $lastRecord->kode, $matches)) {
            $nextId = intval($matches[1]) + 1;
        } elseif ($lastRecord) {
            $nextId = $lastRecord->id + 1;
        }
        return 'INV-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    public function store(StorePeralatanRequest $request)
    {
        $data = $request->validated();
        Peralatan::create($data);

        return redirect()->route('equipments.index')->with('success', 'Peralatan berhasil ditambahkan.');
    }

    public function edit(Peralatan $equipment)
    {
        return Inertia::render('Peralatan/Create', [
            'peralatan' => $equipment
        ]);
    }

    public function update(UpdatePeralatanRequest $request, Peralatan $equipment)
    {
        $data = $request->validated();
        $equipment->update($data);

        return redirect()->route('equipments.index')->with('success', 'Peralatan berhasil diperbarui.');
    }

    public function destroy(Peralatan $equipment)
    {
        $equipment->delete();
        return redirect()->route('equipments.index')->with('success', 'Peralatan berhasil dihapus.');
    }
}
