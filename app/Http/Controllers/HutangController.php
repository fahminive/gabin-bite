<?php

namespace App\Http\Controllers;

use App\Models\Hutang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class HutangController extends Controller
{
    public function index()
    {
        $payables = Hutang::with(['pembelian.pemasok', 'pembayaranHutangs'])->orderBy('created_at', 'desc')->get();
        return Inertia::render('Payables/Index', [
            'payables' => $payables
        ]);
    }

    public function bayarCicilan(Request $request, Hutang $hutang)
    {
        // Hitung sisa hutang yang belum dibayar
        $totalSudahDibayar = $hutang->pembayaranHutangs()->sum('nominal_bayar');
        $sisaTagihan = $hutang->nominal - $totalSudahDibayar;

        $validated = $request->validate([
            'tanggal' => 'required|date',
            'nominal_bayar' => [
                'required',
                'numeric',
                'min:1',
                function ($attribute, $value, $fail) use ($sisaTagihan) {
                    if ($value > $sisaTagihan) {
                        $fail("Nominal bayar tidak boleh melebihi sisa hutang. Maksimal: Rp " . number_format($sisaTagihan, 0, ',', '.') . ".");
                    }
                },
            ],
        ]);

        // --- VALIDASI SALDO KAS ---
        $saldoKas = \App\Models\Kas::sum('masuk') - \App\Models\Kas::sum('keluar');
        if ($validated['nominal_bayar'] > $saldoKas) {
            return back()->withErrors([
                'nominal_bayar' => "Saldo kas perusahaan tidak mencukupi. Saldo saat ini: Rp " . number_format($saldoKas, 0, ',', '.') . "."
            ])->withInput();
        }
        // --------------------------

        DB::transaction(function () use ($validated, $hutang) {
            // 1. Simpan history cicilan
            $pembayaran = $hutang->pembayaranHutangs()->create([
                'tanggal' => $validated['tanggal'],
                'nominal_bayar' => $validated['nominal_bayar'],
            ]);

            // 2. Potong Uang Kas
            $pembayaran->kas()->create([
                'tanggal' => $validated['tanggal'],
                'keterangan' => 'Pembayaran Cicilan Hutang',
                'masuk' => 0, 
                'keluar' => $validated['nominal_bayar'], 
                'sumber' => 'hutang'
            ]);

            // 3. Update status jika lunas
            $totalDibayar = $hutang->pembayaranHutangs()->sum('nominal_bayar');
            
            if ($totalDibayar >= $hutang->nominal) {
                $hutang->update(['status' => 'lunas']);
            }
        });

        return back()->with('success', 'Pembayaran cicilan hutang berhasil.');
    }
}