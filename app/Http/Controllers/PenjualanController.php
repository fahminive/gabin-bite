<?php

namespace App\Http\Controllers;

use App\Models\MetodePembayaran;
use App\Models\Pelanggan;
use App\Models\Penjualan;
use App\Models\PreOrder;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PenjualanController extends Controller
{
    public function index(Request $request)
    {
        $query = Penjualan::with(['pelanggan', 'detailPenjualans.produk', 'preOrder']);

        if ($request->filled('pre_order_id')) {
            $query->where('pre_order_id', $request->input('pre_order_id'));
        }

        $sales = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'batches' => PreOrder::orderByDesc('created_at')->get(),
            'filters' => ['pre_order_id' => $request->input('pre_order_id')],
        ]);
    }

    public function create()
    {
        return Inertia::render('Sales/Create', [
            'customers' => Pelanggan::orderBy('kode', 'asc')->get(),
            'products' => Produk::orderBy('kode', 'asc')->get(),
            'paymentMethods' => MetodePembayaran::orderBy('nama_metode')->get(),
            'batches' => PreOrder::where('status', 'buka')->orderByDesc('tanggal_mulai')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pelanggan_id' => 'nullable|exists:pelanggans,id',
            'nama_lengkap' => 'nullable|string|max:255',
            'alamat' => 'nullable|string|max:1000',
            'no_telepon' => 'nullable|string|max:30',
            // Koordinat opsional: terisi otomatis saat user paste link
            // Google Maps yang mengandung koordinat (diparse di frontend).
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'metode_pembayaran_id' => 'required|exists:metode_pembayarans,id',
            'pre_order_id' => 'nullable|exists:pre_orders,id',
            'no_faktur' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.produk_id' => 'required|exists:produks,id',
            'items.*.qty' => 'required|numeric|min:1',
            'items.*.harga_satuan' => 'required|numeric|min:0',
            'status_pembayaran' => 'nullable|in:belum_bayar,sudah_bayar',
            'status_penyerahan' => 'nullable|in:belum_diberikan,sudah_diberikan',
        ]);

        if (! empty($validated['pre_order_id'])) {
            $batch = PreOrder::find($validated['pre_order_id']);
            if (! $batch || $batch->status !== 'buka') {
                return back()->withErrors(['pre_order_id' => 'Batch pre-order sudah ditutup. Pilih batch yang masih aktif.'])->withInput();
            }
        }

        DB::transaction(function () use ($validated) {
            $totalSales = collect($validated['items'])->sum(fn ($item) => $item['qty'] * $item['harga_satuan']);

            $noFaktur = $validated['no_faktur'] ?? null;
            if (empty($noFaktur)) {
                $last = Penjualan::orderBy('id', 'desc')->first();
                $nextId = $last ? $last->id + 1 : 1;
                $noFaktur = 'PO-'.str_pad($nextId, 5, '0', STR_PAD_LEFT);
            }

            $statusPembayaran = $validated['status_pembayaran'] ?? 'belum_bayar';
            $statusPenyerahan = $validated['status_penyerahan'] ?? 'belum_diberikan';

            $penjualan = Penjualan::create([
                'pelanggan_id' => $validated['pelanggan_id'] ?? null,
                'nama_lengkap' => $validated['nama_lengkap'] ?? null,
                'alamat' => $validated['alamat'] ?? null,
                'no_telepon' => $validated['no_telepon'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'metode_pembayaran_id' => $validated['metode_pembayaran_id'],
                'pre_order_id' => $validated['pre_order_id'] ?? null,
                'no_faktur' => $noFaktur,
                'total' => $totalSales,
                'status' => $statusPenyerahan === 'sudah_diberikan' ? 'selesai' : 'pre_order',
                'status_pembayaran' => $statusPembayaran,
                'status_penyerahan' => $statusPenyerahan,
                'tanggal_bayar' => $statusPembayaran === 'sudah_bayar' ? now() : null,
                'tanggal_diberikan' => $statusPenyerahan === 'sudah_diberikan' ? now() : null,
            ]);

            foreach ($validated['items'] as $item) {
                $penjualan->detailPenjualans()->create([
                    'produk_id' => $item['produk_id'],
                    'qty' => $item['qty'],
                    'harga_satuan' => $item['harga_satuan'],
                    'subtotal' => $item['qty'] * $item['harga_satuan'],
                ]);
            }

            if ($statusPembayaran === 'sudah_bayar') {
                $penjualan->kas()->updateOrCreate(
                    ['kasable_type' => Penjualan::class, 'kasable_id' => $penjualan->id],
                    [
                        'tanggal' => now()->toDateString(),
                        'keterangan' => 'Pembayaran pre-order: '.$noFaktur,
                        'masuk' => $totalSales,
                        'keluar' => 0,
                        'sumber' => 'penjualan',
                    ]
                );
            } elseif ($penjualan->kas) {
                $penjualan->kas->delete();
            }

            // Stok produk jadi hanya berkurang saat barang benar-benar diserahkan.
            // (Penambahan penjualan sendiri tidak mengubah stok apapun.)
            if ($statusPenyerahan === 'sudah_diberikan') {
                foreach ($penjualan->detailPenjualans as $detail) {
                    $detail->produk?->decrement('stok', $detail->qty);
                }
            }
        });

        return redirect()->route('sales.index')->with('success', 'Pesanan pre-order berhasil dicatat.');
    }

    public function fulfill(Penjualan $sale)
    {
        if ($sale->status === 'selesai' && $sale->status_penyerahan === 'sudah_diberikan') {
            return back()->with('error', 'Pre-order ini sudah diselesaikan.');
        }

        $sale->load('detailPenjualans.produk');

        $errors = [];
        foreach ($sale->detailPenjualans as $detail) {
            $produk = $detail->produk;
            if ($produk && $detail->qty > $produk->stok && $sale->status !== 'selesai') {
                $errors[] = "Stok \"{$produk->nama_produk}\" belum cukup. Dibutuhkan {$detail->qty}, stok jadi {$produk->stok}. Produksi dulu sesuai pesanan.";
            }
        }

        if ($errors !== []) {
            return back()->withErrors(['items' => $errors])->with('error', $errors[0]);
        }

        DB::transaction(function () use ($sale) {
            foreach ($sale->detailPenjualans as $detail) {
                if ($detail->produk && $sale->status !== 'selesai') {
                    $detail->produk->decrement('stok', $detail->qty);
                }
            }

            $sale->update([
                'status' => 'selesai',
                'status_penyerahan' => 'sudah_diberikan',
                'tanggal_diberikan' => now(),
            ]);
        });

        return back()->with('success', 'Pre-order diserahkan ke pembeli.');
    }

    public function updateStatus(Request $request, Penjualan $sale)
    {
        $validated = $request->validate([
            'status_pembayaran' => 'required|in:belum_bayar,sudah_bayar',
            'status_penyerahan' => 'required|in:belum_diberikan,sudah_diberikan',
        ]);

        DB::transaction(function () use ($validated, $sale) {
            $data = $validated;

            if ($validated['status_pembayaran'] === 'sudah_bayar' && ! $sale->tanggal_bayar) {
                $data['tanggal_bayar'] = now();
            } elseif ($validated['status_pembayaran'] === 'belum_bayar') {
                $data['tanggal_bayar'] = null;
            }

            if ($validated['status_penyerahan'] === 'sudah_diberikan' && ! $sale->tanggal_diberikan) {
                $data['tanggal_diberikan'] = now();
                if ($sale->status !== 'selesai') {
                    $sale->load('detailPenjualans.produk');
                    foreach ($sale->detailPenjualans as $detail) {
                        if ($detail->produk) {
                            $detail->produk->decrement('stok', $detail->qty);
                        }
                    }
                    $data['status'] = 'selesai';
                }
            } elseif ($validated['status_penyerahan'] === 'belum_diberikan' && $sale->tanggal_diberikan) {
                // Kembalikan ke belum diserahan: stok yang sudah dipotong harus dikembalikan
                // agar tidak double-decrement / stok tidak konsisten.
                $data['tanggal_diberikan'] = null;
                $sale->load('detailPenjualans.produk');
                foreach ($sale->detailPenjualans as $detail) {
                    if ($detail->produk) {
                        $detail->produk->increment('stok', $detail->qty);
                    }
                }
                if ($sale->status === 'selesai') {
                    $data['status'] = 'pre_order';
                }
            } elseif ($validated['status_penyerahan'] === 'belum_diberikan') {
                $data['tanggal_diberikan'] = null;
                if ($sale->status === 'selesai') {
                    $data['status'] = 'pre_order';
                }
            }

            $sale->update($data);

            if ($validated['status_pembayaran'] === 'sudah_bayar') {
                $sale->kas()->updateOrCreate(
                    ['kasable_type' => Penjualan::class, 'kasable_id' => $sale->id],
                    [
                        'tanggal' => now()->toDateString(),
                        'keterangan' => 'Pembayaran pre-order: '.$sale->no_faktur,
                        'masuk' => $sale->total,
                        'keluar' => 0,
                        'sumber' => 'penjualan',
                    ]
                );
            } elseif ($sale->kas) {
                $sale->kas->delete();
            }
        });

        return back()->with('success', 'Status pesanan diperbarui.');
    }

    public function destroy(Penjualan $sale)
    {
        DB::transaction(function () use ($sale) {
            if ($sale->status === 'selesai') {
                $sale->load('detailPenjualans.produk');
                foreach ($sale->detailPenjualans as $detail) {
                    if ($detail->produk) {
                        $detail->produk->increment('stok', $detail->qty);
                    }
                }
            }

            if ($sale->kas) {
                $sale->kas->delete();
            }

            $sale->delete();
        });

        return redirect()->route('sales.index')->with('success', 'Pre-order dihapus.');
    }
}
