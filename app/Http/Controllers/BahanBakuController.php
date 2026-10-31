<?php

namespace App\Http\Controllers;

use App\Http\Requests\BahanBaku\StoreBahanBakuRequest;
use App\Http\Requests\BahanBaku\UpdateBahanBakuRequest;
use App\Models\BahanBaku;
use Inertia\Inertia;

class BahanBakuController extends Controller
{
    public function index() {
        $materials = BahanBaku::orderBy('kode', 'asc')->get();
        return Inertia::render('BahanBaku/Index', [
            'user' => 'Dashboard Bahan Baku',
            'materials' => $materials
        ]);
    }

    public function create() {
        return Inertia::render('BahanBaku/Create', [
            'defaultKode' => $this->generateKode()
        ]);
    }

    private function generateKode() {
        $lastRecord = BahanBaku::orderBy('id', 'desc')->first();
        $nextId = 1;
        if ($lastRecord && preg_match('/-(\d+)$/', $lastRecord->kode, $matches)) {
            $nextId = intval($matches[1]) + 1;
        } elseif ($lastRecord) {
            $nextId = $lastRecord->id + 1;
        }
        return 'BB-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    public function store(StoreBahanBakuRequest $request) {
        $data = $request->validated();
        $data['stok'] = $data['stok'] ?? 0; // Set default 0 jika kosong
        BahanBaku::create($data);

        return redirect()->route('materials.index')->with('success', 'Bahan baku berhasil ditambahkan.');       
    }

    public function edit(BahanBaku $material) {
        return Inertia::render('BahanBaku/Create', [
            'bahanBaku' => $material
        ]);
    }

    public function update(UpdateBahanBakuRequest $request, BahanBaku $material) {
        $data = $request->validated();
        unset($data['stok']); // Cegah update stok dari form edit

        $material->update($data);

        return redirect()->route('materials.index')->with('success', 'Bahan baku berhasil diperbarui.');
    }

    public function destroy(BahanBaku $material) {
        $material->delete();
        return redirect()->route('materials.index')->with('success', 'Bahan baku berhasil dihapus.');
    }
}
