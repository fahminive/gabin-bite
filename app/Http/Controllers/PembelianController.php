<?php

namespace App\Http\Controllers;

use App\Models\BahanBaku;
use App\Models\MetodePembayaran;
use App\Models\Mitra;
use App\Models\Pemasok;
use App\Models\Pembelian;
use App\Models\PreOrder;
use App\Models\SplitTagihan;
use App\Services\SplitBillService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PembelianController extends Controller
{
    public function index(Request $request)
    {
        $query = Pembelian::with(['pemasok', 'mitra', 'preOrder', 'hutang', 'detailPembelians.bahanBaku', 'splitTagihans.mitra']);

        if ($request->filled('pre_order_id')) {
            $query->where('pre_order_id', $request->input('pre_order_id'));
        }

        $purchases = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Purchases/Index', [
            'purchases' => $purchases,
            'batches' => PreOrder::orderByDesc('created_at')->get(),
            'filters' => ['pre_order_id' => $request->input('pre_order_id')],
        ]);
    }

    public function create()
    {
        Mitra::ensureTrio();

        return Inertia::render('Purchases/Create', [
            'pemasoks' => Pemasok::orderBy('kode', 'asc')->get(),
            'bahanBakus' => BahanBaku::orderBy('kode', 'asc')->get(),
            'metodePembayarans' => MetodePembayaran::orderBy('nama_metode')->get(),
            'mitras' => Mitra::orderBy('kode')->get(),
            'batches' => PreOrder::where('status', 'buka')->orderByDesc('tanggal_mulai')->get(),
        ]);
    }

    public function store(Request $request, SplitBillService $splitBill)
    {
        $validated = $request->validate([
            'pemasok_id' => 'required|exists:pemasoks,id',
            'metode_pembayaran_id' => 'required|exists:metode_pembayarans,id',
            'sumber_dana' => ['required', 'string', 'in:pribadi,simpanan_usaha'],
            'mitra_id' => ['required_if:sumber_dana,pribadi', 'nullable', 'exists:mitras,id'],
            'nama_pembelian' => 'required|string|max:255',
            'pre_order_id' => 'nullable|exists:pre_orders,id',
            'items' => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'items.*.qty_masuk_stok' => 'required|numeric|min:1',
            'items.*.harga_satuan' => 'required|integer|min:0',
        ]);

        if (! empty($validated['pre_order_id'])) {
            $batch = PreOrder::find($validated['pre_order_id']);
            if (! $batch || $batch->status !== 'buka') {
                return back()->withErrors(['pre_order_id' => 'Batch pre-order sudah ditutup. Pilih batch yang masih aktif.'])->withInput();
            }
        }

        $totalPembelian = collect($validated['items'])->sum(fn ($item) => (int) $item['qty_masuk_stok'] * $item['harga_satuan']);

        DB::transaction(function () use ($validated, $totalPembelian, $splitBill) {
            $pembelian = Pembelian::create([
                'pemasok_id' => $validated['pemasok_id'],
                'metode_pembayaran_id' => $validated['metode_pembayaran_id'],
                'mitra_id' => $validated['sumber_dana'] === 'pribadi' ? $validated['mitra_id'] : null,
                'pre_order_id' => $validated['pre_order_id'] ?? null,
                'nama_pembelian' => $validated['nama_pembelian'],
                'total' => $totalPembelian,
                'sumber_dana' => $validated['sumber_dana'],
            ]);

            foreach ($validated['items'] as $item) {
                $bahanBaku = BahanBaku::findOrFail($item['bahan_baku_id']);

                $qtyMasukStok = (int) $item['qty_masuk_stok'];

                $pembelian->detailPembelians()->create([
                    'bahan_baku_id' => $item['bahan_baku_id'],
                    'qty' => $qtyMasukStok,
                    'harga_satuan' => $item['harga_satuan'],
                    'subtotal' => $qtyMasukStok * $item['harga_satuan'],
                    'satuan' => $bahanBaku->satuan,
                ]);

                $bahanBaku->increment('stok', $qtyMasukStok);
            }

            // Split bill hanya dibuat ketika partner membayar dari pribadi.
            // Jika dibayar dari simpanan usaha, tidak ada utang partner yang terbentuk.
            if ($validated['sumber_dana'] === 'pribadi') {
                $splitBill->createForPembelian($pembelian);
            }
        });

        return redirect()->route('purchases.index')->with('success', 'Pembelian bahan baku berhasil dicatat.');
    }

    public function destroy(Pembelian $purchase)
    {
        DB::transaction(function () use ($purchase) {
            foreach ($purchase->detailPembelians as $detail) {
                if ($detail->bahanBaku) {
                    $detail->bahanBaku->decrement('stok', $detail->qty);
                }
            }

            SplitTagihan::where('pembelian_id', $purchase->id)->delete();

            $purchase->delete();
        });

        return redirect()->route('purchases.index')->with('success', 'Pembelian dihapus dan stok bahan dikembalikan.');
    }
}
