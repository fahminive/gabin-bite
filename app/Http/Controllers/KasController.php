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

        $query = Kas::orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc');

        if ($preOrderId) {
            $query->where(function ($q) use ($preOrderId) {
                $q->whereHasMorph('kasable', [\App\Models\Penjualan::class], function ($sq) use ($preOrderId) {
                    $sq->where('pre_order_id', $preOrderId);
                })
                ->orWhereHasMorph('kasable', [\App\Models\Pembelian::class], function ($sq) use ($preOrderId) {
                    $sq->where('pre_order_id', $preOrderId);
                })
                ->orWhereHasMorph('kasable', [\App\Models\PengeluaranOperasional::class], function ($sq) use ($preOrderId) {
                    $sq->where('pre_order_id', $preOrderId);
                });
            });
        }

        $transactions = $query->get();

        $totalMasuk = Kas::sum('masuk');
        $totalKeluar = Kas::sum('keluar');
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

        // --- VALIDASI SALDO KAS MINUS ---
        if ($keluar > 0) {
            $saldoSaatIni = Kas::sum('masuk') - Kas::sum('keluar');
            if ($keluar > $saldoSaatIni) {
                return back()->withErrors([
                    'nominal' => "Saldo kas tidak mencukupi untuk pengeluaran ini. Pastikan saldo tercukupi atau catat pemasukan terlebih dahulu."
                ])->withInput();
            }
        }
        // --------------------------------

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

        // --- VALIDASI SALDO KAS MINUS SAAT HAPUS ---
        if ($cash->masuk > 0) {
            $saldoSaatIni = Kas::sum('masuk') - Kas::sum('keluar');
            if (($saldoSaatIni - $cash->masuk) < 0) {
                return redirect()->route('cash.index')->with('error', 'Gagal menghapus! Menghapus data kas masuk ini akan membuat total saldo kas menjadi minus.');
            }
        }
        // -------------------------------------------

        $cash->delete();
        return redirect()->route('cash.index')->with('success', 'Penyesuaian kas berhasil dihapus.');
    }
}
