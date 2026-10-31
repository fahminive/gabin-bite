<?php

namespace App\Http\Controllers;

use App\Models\Mitra;
use App\Models\MitraTransfer;
use App\Models\Pembelian;
use App\Models\PengeluaranOperasional;
use App\Models\PreOrder;
use App\Models\SplitTagihan;
use App\Services\SplitBillService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SplitBillController extends Controller
{
    public function index(Request $request, SplitBillService $splitBill)
    {
        Mitra::ensureTrio();

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $preOrderId = $request->input('pre_order_id');

        $query = Pembelian::with(['mitra', 'preOrder', 'splitTagihans.mitra'])
            ->whereHas('splitTagihans')
            ->orderBy('created_at', 'desc');

        if ($startDate && $endDate) {
            $query->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate]);
        }
        if ($preOrderId) {
            $query->where('pre_order_id', $preOrderId);
        }

        $purchases = $query->get();

        $expensesQuery = PengeluaranOperasional::with(['mitra', 'preOrder', 'splitTagihans.mitra'])
            ->whereHas('splitTagihans')
            ->orderBy('tanggal', 'desc');

        if ($startDate && $endDate) {
            $expensesQuery->whereBetween('tanggal', [$startDate, $endDate]);
        }
        if ($preOrderId) {
            $expensesQuery->where('pre_order_id', $preOrderId);
        }

        $expenses = $expensesQuery->get();

        $transfersQuery = MitraTransfer::with(['dariMitra', 'keMitra', 'preOrder'])
            ->orderByDesc('tanggal')
            ->orderByDesc('id');

        if ($startDate && $endDate) {
            $transfersQuery->whereBetween('tanggal', [$startDate, $endDate]);
        }
        if ($preOrderId) {
            $transfersQuery->where('pre_order_id', $preOrderId);
        }

        $transfers = $transfersQuery->get();

        return Inertia::render('SplitBill/Index', [
            'mitras' => Mitra::with('user')->orderBy('kode')->get(),
            'balances' => $splitBill->balances($preOrderId ? (int) $preOrderId : null),
            'obligations' => $splitBill->memberObligations($preOrderId ? (int) $preOrderId : null),
            'purchases' => $purchases,
            'expenses' => $expenses,
            'transfers' => $transfers,
            'batches' => PreOrder::orderByDesc('created_at')->get(),
            'filters' => [
                'startDate' => $startDate,
                'endDate' => $endDate,
                'pre_order_id' => $preOrderId,
            ],
        ]);
    }

    public function updateMitra(Request $request, Mitra $mitra)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:100',
        ]);

        $mitra->update($validated);

        return back()->with('success', 'Nama partner diperbarui.');
    }

    public function settle(SplitTagihan $splitTagihan)
    {
        $splitTagihan->update([
            'status' => 'lunas',
            'lunas_at' => now(),
        ]);

        return back()->with('success', 'Bagian split bill ditandai lunas.');
    }

    public function storeTransfer(Request $request)
    {
        $validated = $this->validateTransfer($request);

        MitraTransfer::create($validated);

        return back()->with('success', 'Pembayaran antar partner berhasil dicatat.');
    }

    public function updateTransfer(Request $request, MitraTransfer $transfer)
    {
        $validated = $this->validateTransfer($request);

        $transfer->update($validated);

        return back()->with('success', 'Pembayaran antar partner berhasil diperbarui.');
    }

    public function destroyTransfer(MitraTransfer $transfer)
    {
        $transfer->delete();

        return back()->with('success', 'Catatan pembayaran antar partner berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateTransfer(Request $request): array
    {
        $validated = $request->validate([
            'dari_mitra_id' => 'required|integer|exists:mitras,id|different:ke_mitra_id',
            'ke_mitra_id' => 'required|integer|exists:mitras,id',
            'nominal' => 'required|numeric|min:0.01',
            'tanggal' => 'required|date',
            'pre_order_id' => 'nullable|integer|exists:pre_orders,id',
            'keterangan' => 'nullable|string|max:255',
        ], [
            'dari_mitra_id.different' => 'Partner pembayar dan penerima tidak boleh sama.',
            'nominal.min' => 'Nominal pembayaran harus lebih dari nol.',
        ]);

        $validated['tanggal'] = Carbon::parse($validated['tanggal'])->toDateString();

        return $validated;
    }
}
