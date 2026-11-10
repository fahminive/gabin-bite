<?php

namespace App\Http\Controllers;

use App\Models\PreOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PreOrderController extends Controller
{
    public function index()
    {
        $batches = PreOrder::withCount(['pembelians', 'penjualans'])
            ->withSum('penjualans', 'total')
            ->withSum('pembelians', 'total')
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('PreOrder/Index', [
            'batches' => $batches,
            'defaultKode' => $this->generateKode(),
        ]);
    }

    private function generateKode(): string
    {
        $lastRecord = PreOrder::orderBy('id', 'desc')->first();
        $nextId = $lastRecord ? $lastRecord->id + 1 : 1;
        return 'PO-B' . $nextId;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:20|unique:pre_orders,kode',
            'keterangan' => 'required|string|max:255',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'status' => 'required|in:buka,tutup,selesai',
        ]);

        PreOrder::create($validated);

        return redirect()->route('pre-orders.index')->with('success', 'Batch Pre-Order berhasil dibuat.');
    }

    public function update(Request $request, PreOrder $preOrder)
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:20|unique:pre_orders,kode,' . $preOrder->id,
            'keterangan' => 'required|string|max:255',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'status' => 'required|in:buka,tutup,selesai',
        ]);

        $preOrder->update($validated);

        return redirect()->route('pre-orders.index')->with('success', 'Batch Pre-Order berhasil diperbarui.');
    }

    public function destroy(PreOrder $preOrder)
    {
        if ($preOrder->pembelians()->exists() || $preOrder->penjualans()->exists()) {
            return redirect()->route('pre-orders.index')->with('error', 'Batch tidak dapat dihapus karena masih memiliki transaksi terkait.');
        }

        $preOrder->delete();
        return redirect()->route('pre-orders.index')->with('success', 'Batch Pre-Order dihapus.');
    }
}
