<?php

namespace App\Http\Controllers;

use App\Models\KoreksiStok;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class KoreksiStokController extends Controller
{
    public function index()
    {
        $stockCorrections = KoreksiStok::with('produk')
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::now()->endOfMonth()->toDateString();

        $totalMasukBulanIni = KoreksiStok::where('jenis_koreksi', 'masuk')
            ->whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->sum('qty');

        $totalKeluarBulanIni = KoreksiStok::where('jenis_koreksi', 'keluar')
            ->whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->sum('qty');

        $totalTransaksiBulanIni = KoreksiStok::whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->count();

        return Inertia::render('StockCorrection/Index', [
            'stockCorrections' => $stockCorrections,
            'metrics' => [
                'totalMasukBulanIni' => (int)$totalMasukBulanIni,
                'totalKeluarBulanIni' => (int)$totalKeluarBulanIni,
                'totalTransaksiBulanIni' => $totalTransaksiBulanIni,
            ]
        ]);
    }

    public function create()
    {
        return Inertia::render('StockCorrection/Create', [
            'products' => Produk::orderBy('kode', 'asc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal' => 'required|date',
            'produk_id' => 'required|exists:produks,id',
            'jenis_koreksi' => 'required|in:masuk,keluar',
            'qty' => 'required|integer|min:1',
            'keterangan' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            // 1. Simpan Koreksi Stok
            KoreksiStok::create([
                'tanggal' => $validated['tanggal'],
                'produk_id' => $validated['produk_id'],
                'jenis_koreksi' => $validated['jenis_koreksi'],
                'qty' => $validated['qty'],
                'keterangan' => $validated['keterangan'] ?? '',
            ]);

            // 2. Sesuaikan stok produk jadi
            $produk = Produk::findOrFail($validated['produk_id']);
            if ($validated['jenis_koreksi'] === 'masuk') {
                $produk->increment('stok', $validated['qty']);
            } else {
                $produk->decrement('stok', $validated['qty']);
            }
        });

        return redirect()->route('stock-corrections.index')->with('success', 'Koreksi Stok Berhasil Dicatat.');
    }

    public function destroy(KoreksiStok $stockCorrection)
    {
        DB::transaction(function () use ($stockCorrection) {
            // 1. Revert stok produk jadi
            $produk = $stockCorrection->produk;
            if ($stockCorrection->jenis_koreksi === 'masuk') {
                $produk->decrement('stok', $stockCorrection->qty);
            } else {
                $produk->increment('stok', $stockCorrection->qty);
            }

            // 2. Hapus data koreksi stok
            $stockCorrection->delete();
        });

        return redirect()->route('stock-corrections.index')->with('success', 'Koreksi Stok berhasil dihapus dan stok telah dikembalikan.');
    }
}
