<?php

namespace App\Http\Controllers;

use App\Http\Requests\PengeluaranOperasional\StorePengeluaranOperasionalRequest;
use App\Http\Requests\PengeluaranOperasional\UpdatePengeluaranOperasionalRequest;
use App\Models\Mitra;
use App\Models\PengeluaranOperasional;
use App\Models\PreOrder;
use App\Services\SplitBillService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PengeluaranOperasionalController extends Controller
{
    public function index(Request $request)
    {
        $query = PengeluaranOperasional::with(['preOrder', 'mitra']);

        if ($request->filled('pre_order_id')) {
            $query->where('pre_order_id', $request->input('pre_order_id'));
        }

        $expenses = $query->orderBy('tanggal', 'desc')->get();

        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::now()->endOfMonth()->toDateString();

        $totalBulanIni = PengeluaranOperasional::whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->sum('nominal');

        $pengeluaranTerbesarRecord = PengeluaranOperasional::orderBy('nominal', 'desc')->first();
        $pengeluaranTerbesar = [
            'kategori' => $pengeluaranTerbesarRecord ? $pengeluaranTerbesarRecord->kategori : '-',
            'nominal' => $pengeluaranTerbesarRecord ? $pengeluaranTerbesarRecord->nominal : 0,
        ];

        $jumlahTransaksi = PengeluaranOperasional::count();

        return Inertia::render('PengeluaranOperasional/Index', [
            'expenses' => $expenses,
            'batches' => PreOrder::orderByDesc('created_at')->get(),
            'filters' => ['pre_order_id' => $request->input('pre_order_id')],
            'metrics' => [
                'totalBulanIni' => $totalBulanIni,
                'pengeluaranTerbesar' => $pengeluaranTerbesar,
                'jumlahTransaksi' => $jumlahTransaksi,
            ]
        ]);
    }

    public function create()
    {
        Mitra::ensureTrio();

        return Inertia::render('PengeluaranOperasional/Create', [
            'batches' => PreOrder::orderByDesc('tanggal_mulai')->get(),
            'mitras' => Mitra::orderBy('kode')->get(),
        ]);
    }

    public function store(StorePengeluaranOperasionalRequest $request, SplitBillService $splitBill)
    {
        $data = $request->validated();
        $data['pre_order_id'] = $data['pre_order_id'] ?? null;
        $data['mitra_id'] = $data['mitra_id'] ?? null;
        $data['is_bersama'] = $request->boolean('is_bersama');
        $data['sumber_dana'] = $data['sumber_dana'] ?? 'pribadi';

        // --- VALIDASI SALDO KAS ---
        $saldoKas = \App\Models\Kas::sum('masuk') - \App\Models\Kas::sum('keluar');
        if (($data['nominal'] ?? 0) > $saldoKas) {
            return back()->withErrors([
                'nominal' => "Saldo kas perusahaan tidak mencukupi. Saldo saat ini: Rp " . number_format($saldoKas, 0, ',', '.') . "."
            ])->withInput();
        }
        // --------------------------

        DB::transaction(function () use ($data, $splitBill) {
            $operasional = PengeluaranOperasional::create($data);
            if ($operasional->is_bersama) {
                $splitBill->createForOperasional($operasional);
            }
        });

        return redirect()->route('operational-expenses.index')->with('success', 'Biaya operasional berhasil dicatat.');
    }

    public function edit(PengeluaranOperasional $operationalExpense)
    {
        Mitra::ensureTrio();

        return Inertia::render('PengeluaranOperasional/Create', [
            'expense' => $operationalExpense,
            'batches' => PreOrder::orderByDesc('tanggal_mulai')->get(),
            'mitras' => Mitra::orderBy('kode')->get(),
        ]);
    }

    public function update(UpdatePengeluaranOperasionalRequest $request, PengeluaranOperasional $operationalExpense, SplitBillService $splitBill)
    {
        $data = $request->validated();
        $data['pre_order_id'] = $data['pre_order_id'] ?? null;
        $data['mitra_id'] = $data['mitra_id'] ?? null;
        $data['is_bersama'] = $request->boolean('is_bersama');

        DB::transaction(function () use ($data, $operationalExpense, $splitBill) {
            $operationalExpense->update($data);
            if ($operationalExpense->is_bersama) {
                $splitBill->createForOperasional($operationalExpense);
            } else {
                \App\Models\SplitTagihan::where('pengeluaran_operasional_id', $operationalExpense->id)->delete();
            }
        });

        return redirect()->route('operational-expenses.index')->with('success', 'Biaya operasional berhasil diperbarui.');
    }

    public function destroy(PengeluaranOperasional $operationalExpense)
    {
        DB::transaction(function () use ($operationalExpense) {
            \App\Models\SplitTagihan::where('pengeluaran_operasional_id', $operationalExpense->id)->delete();
            if ($operationalExpense->kas) {
                $operationalExpense->kas->delete();
            }
            $operationalExpense->delete();
        });
        return redirect()->route('operational-expenses.index')->with('success', 'Biaya operasional berhasil dihapus.');
    }
}
