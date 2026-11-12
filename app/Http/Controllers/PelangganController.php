<?php

namespace App\Http\Controllers;

use App\Http\Requests\Pelanggan\StorePelangganRequest;
use App\Http\Requests\Pelanggan\UpdatePelangganRequest;
use App\Models\Pelanggan;
use Inertia\Inertia;

class PelangganController extends Controller
{
    public function index()
    {
        $customers = Pelanggan::with(['penjualans' => fn ($query) => $query->with('preOrder')->latest()])
            ->orderBy('kode', 'asc')->get();
        return Inertia::render('Pelanggan/Index', [
            'customers' => $customers
        ]);
    }

    public function create()
    {
        return Inertia::render('Pelanggan/Create', [
            'defaultKode' => $this->generateKode()
        ]);
    }

    private function generateKode() {
        $lastRecord = Pelanggan::orderBy('id', 'desc')->first();
        $nextId = 1;
        if ($lastRecord && preg_match('/-(\d+)$/', $lastRecord->kode, $matches)) {
            $nextId = intval($matches[1]) + 1;
        } elseif ($lastRecord) {
            $nextId = $lastRecord->id + 1;
        }
        return 'PLG-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    public function store(StorePelangganRequest $request)
    {
        $data = $request->validated();
        Pelanggan::create($data);

        return redirect()->route('customers.index')->with('success', 'Pelanggan berhasil ditambahkan.');
    }

    public function edit(Pelanggan $customer)
    {
        return Inertia::render('Pelanggan/Create', [
            'pelanggan' => $customer
        ]);
    }

    public function update(UpdatePelangganRequest $request, Pelanggan $customer)
    {
        $data = $request->validated();
        $customer->update($data);

        return redirect()->route('customers.index')->with('success', 'Pelanggan berhasil diperbarui.');
    }

    public function destroy(Pelanggan $customer)
    {
        $customer->delete();
        return redirect()->route('customers.index')->with('success', 'Pelanggan berhasil dihapus.');
    }
}
