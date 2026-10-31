<?php

namespace App\Http\Controllers;

use App\Http\Requests\MetodePembayaran\StoreMetodePembayaranRequest;
use App\Http\Requests\MetodePembayaran\UpdateMetodePembayaranRequest;
use App\Models\MetodePembayaran;
use Inertia\Inertia;

class MetodePembayaranController extends Controller
{
    public function index()
    {
        $paymentMethods = MetodePembayaran::orderBy('nama_metode')->get();
        return Inertia::render('MetodePembayaran/Index', [
            'paymentMethods' => $paymentMethods
        ]);
    }

    public function create()
    {
        return Inertia::render('MetodePembayaran/Create', [
            'defaultKode' => $this->generateKode()
        ]);
    }

    private function generateKode() {
        $lastRecord = MetodePembayaran::orderBy('id', 'desc')->first();
        $nextId = 1;
        if ($lastRecord && $lastRecord->kode && preg_match('/-(\d+)$/', $lastRecord->kode, $matches)) {
            $nextId = intval($matches[1]) + 1;
        } elseif ($lastRecord) {
            $nextId = $lastRecord->id + 1;
        }
        return 'MP-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    public function store(StoreMetodePembayaranRequest $request)
    {
        $data = $request->validated();
        MetodePembayaran::create($data);

        return redirect()->route('payment-methods.index')->with('success', 'Metode pembayaran berhasil ditambahkan.');
    }

    public function edit(MetodePembayaran $paymentMethod)
    {
        return Inertia::render('MetodePembayaran/Create', [
            'paymentMethod' => $paymentMethod
        ]);
    }

    public function update(UpdateMetodePembayaranRequest $request, MetodePembayaran $paymentMethod)
    {
        $data = $request->validated();
        $paymentMethod->update($data);

        return redirect()->route('payment-methods.index')->with('success', 'Metode pembayaran berhasil diperbarui.');
    }

    public function destroy(MetodePembayaran $paymentMethod)
    {
        $paymentMethod->delete();
        return redirect()->route('payment-methods.index')->with('success', 'Metode pembayaran berhasil dihapus.');
    }
}
