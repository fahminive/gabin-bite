<?php

namespace App\Http\Controllers;

use App\Http\Requests\Kas\StoreKasRequest;
use App\Models\Kas;
use App\Models\Mitra;
use App\Models\PreOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KasController extends Controller
{
    public function index(Request $request)
    {
        $preOrderId = $request->input('pre_order_id');

        $query = Kas::query()
            ->forPreOrder($preOrderId)
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc');

        $transactions = $query->get();

        $totalMasuk = (float) $transactions->sum('masuk');
        $totalKeluar = (float) $transactions->sum('keluar');
        $saldoSaatIni = $totalMasuk - $totalKeluar;

        return Inertia::render('Kas/Index', [
            'transactions' => $transactions,
            'mitras' => Mitra::orderBy('kode')->get(),
            'batches' => PreOrder::orderByDesc('created_at')->get(),
            'filters' => ['pre_order_id' => $preOrderId],
            'metrics' => [
                'totalMasuk' => $totalMasuk,
                'totalKeluar' => $totalKeluar,
                'saldoSaatIni' => $saldoSaatIni,
            ]
        ]);
    }

    public function store(StoreKasRequest $request)
    {
        $data = $request->validated();
        
        $masuk = $data['tipe_penyesuaian'] === 'masuk' ? $data['nominal'] : 0;
        $keluar = $data['tipe_penyesuaian'] === 'keluar' ? $data['nominal'] : 0;

        // Saldo kas boleh minus (diminta owner): tidak ada validasi saldo tidak mencukupi.

        Kas::create([
            'tanggal' => $data['tanggal'],
            'keterangan' => $data['keterangan'],
            'masuk' => $masuk,
            'keluar' => $keluar,
            'sumber' => 'lainnya',
            'sumber_dana' => $data['sumber_dana'] ?? null,
            'mitra_id' => $data['sumber_dana'] === 'pribadi' ? ($data['mitra_id'] ?? null) : null,
            'kasable_id' => null,
            'kasable_type' => null,
        ]);

        return redirect()->route('cash.index')->with('success', 'Penyesuaian kas berhasil dicatat.');
    }

    public function destroy(Kas $cash)
    {
        // Only allow deleting manual adjustments (sumber = 'lainnya')
        if ($cash->sumber !== 'lainnya') {
            return redirect()->route('cash.index')->with('error', 'Transaksi otomatis tidak dapat dihapus secara langsung. Hapus dari sumber transaksinya.');
        }

        // Saldo boleh minus (diminta owner): penghapusan penyesuaian masuk tidak diblokir.
        $cash->delete();
        return redirect()->route('cash.index')->with('success', 'Penyesuaian kas berhasil dihapus.');
    }
}
