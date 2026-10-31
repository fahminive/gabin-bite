<?php

namespace App\Http\Controllers;

use App\Models\Produksi;
use App\Models\Produk;
use App\Models\BahanBaku;
use App\Models\Resep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class ProduksiController extends Controller
{
    public function index()
    {
        $productions = Produksi::with(['produk', 'pemakaianBahans.bahanBaku'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::now()->endOfMonth()->toDateString();

        $totalHasilBulanIni = Produksi::whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->sum('qty_hasil');

        $totalTransaksiBulanIni = Produksi::whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->count();

        return Inertia::render('Production/Index', [
            'productions' => $productions,
            'metrics' => [
                'totalHasilBulanIni' => (int)$totalHasilBulanIni,
                'totalTransaksiBulanIni' => $totalTransaksiBulanIni,
            ]
        ]);
    }

    public function create()
    {
        return Inertia::render('Production/Create', [
            'products' => Produk::orderBy('kode', 'asc')->get(),
            'bahanBakus' => BahanBaku::orderBy('kode', 'asc')->get(),
            'recipes' => Resep::orderBy('produk_id')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => 'required|date',
            'produk_id' => 'required|exists:produks,id',
            'qty_hasil' => 'required|integer|min:1',
            'keterangan' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'items.*.qty_bahan_dipakai' => 'required|integer|min:1',
        ]);

        // --- VALIDASI STOK BAHAN BAKU SEBELUM TRANSAKSI ---
        $errors = [];
        foreach ($validated['items'] as $item) {
            $bahanBaku = BahanBaku::findOrFail($item['bahan_baku_id']);
            if ($item['qty_bahan_dipakai'] > $bahanBaku->stok) {
                $errors[] = "Stok bahan baku \"{$bahanBaku->nama_bahan}\" tidak mencukupi. "
                    . "Dibutuhkan: {$item['qty_bahan_dipakai']} {$bahanBaku->satuan}, "
                    . "Sisa stok: {$bahanBaku->stok} {$bahanBaku->satuan}.";
            }
        }
        if (!empty($errors)) {
            return back()->withErrors(['items' => $errors])->withInput();
        }
        // ---------------------------------------------------

        DB::transaction(function () use ($validated) {
            // 1. Simpan Header Produksi
            $produksi = Produksi::create([
                'tanggal' => $validated['tanggal'],
                'produk_id' => $validated['produk_id'],
                'qty_hasil' => $validated['qty_hasil'],
                'keterangan' => $validated['keterangan'] ?? '',
            ]);

            // 2. Looping Items Pemakaian Bahan
            foreach ($validated['items'] as $item) {
                $bahanBaku = BahanBaku::findOrFail($item['bahan_baku_id']);

                $produksi->pemakaianBahans()->create([
                    'bahan_baku_id' => $item['bahan_baku_id'],
                    'qty_bahan_dipakai' => $item['qty_bahan_dipakai'],
                ]);

                // Kurangi stok bahan mentah
                $bahanBaku->decrement('stok', $item['qty_bahan_dipakai']);
            }

            // 3. Tambah stok produk jadi
            $produk = Produk::findOrFail($validated['produk_id']);
            $produk->increment('stok', $validated['qty_hasil']);
        });

        return redirect()->route('productions.index')->with('success', 'Transaksi Produksi Berhasil Dicatat.');
    }

    public function destroy(Produksi $production)
    {
        DB::transaction(function () use ($production) {
            // 1. Kembalikan stok bahan baku
            foreach ($production->pemakaianBahans as $detail) {
                $detail->bahanBaku->increment('stok', $detail->qty_bahan_dipakai);
            }

            // 2. Kurangi stok produk jadi
            $production->produk->decrement('stok', $production->qty_hasil);

            // 3. Hapus data produksi (cascade delete akan menghapus pemakaian_bahans)
            $production->delete();
        });

        return redirect()->route('productions.index')->with('success', 'Transaksi Produksi berhasil dihapus dan stok telah dikembalikan.');
    }
}
