<?php

namespace App\Http\Controllers;

use App\Http\Requests\Produk\StoreProdukRequest;
use App\Http\Requests\Produk\UpdateProdukRequest;
use App\Models\Produk;
use App\Models\BahanBaku;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProdukController extends Controller
{
    public function index() {
        $products = Produk::orderBy('kode', 'asc')->get();
        return Inertia::render('Produk/Index', [
            'user' => 'Dashboard Produk',
            'products' => $products
        ]);
    }

    public function create() {
        return Inertia::render('Produk/Create', [
            'defaultKode' => $this->generateKode(),
            'bahanBakus' => BahanBaku::orderBy('kode', 'asc')->get(),
        ]);
    }

    private function generateKode() {
        $lastRecord = Produk::orderBy('id', 'desc')->first();
        $nextId = 1;
        if ($lastRecord && preg_match('/-(\d+)$/', $lastRecord->kode, $matches)) {
            $nextId = intval($matches[1]) + 1;
        } elseif ($lastRecord) {
            $nextId = $lastRecord->id + 1;
        }
        return 'PRD-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    public function store(StoreProdukRequest $request) {
        $data = $request->validated();
        $data['stok'] = $data['stok'] ?? 0; // Set default 0 jika kosong

        DB::transaction(function () use ($data) {
            $product = Produk::create([
                'kode' => $data['kode'],
                'nama_produk' => $data['nama_produk'],
                'stok' => $data['stok'],
                'satuan' => $data['satuan'],
                'hpp' => $data['hpp'],
                'harga_jual' => $data['harga_jual'],
            ]);

            // Save recipe
            foreach ($data['recipe'] as $recipeItem) {
                $product->reseps()->create([
                    'bahan_baku_id' => $recipeItem['bahan_baku_id'],
                    'qty' => $recipeItem['qty'],
                ]);
            }
        });

        return redirect()->route('products.index')->with('success', 'Produk berhasil ditambahkan.');       
    }

    public function edit(Produk $product) {
        return Inertia::render('Produk/Create', [
            'product' => $product->load('reseps'),
            'bahanBakus' => BahanBaku::orderBy('kode', 'asc')->get(),
        ]);
    }

    public function update(UpdateProdukRequest $request, Produk $product) {
        $data = $request->validated();
        unset($data['stok']); // Cegah update stok dari form edit

        DB::transaction(function () use ($product, $data) {
            $product->update([
                'kode' => $data['kode'],
                'nama_produk' => $data['nama_produk'],
                'satuan' => $data['satuan'],
                'hpp' => $data['hpp'],
                'harga_jual' => $data['harga_jual'],
            ]);

            // Sync recipe: delete old and create new
            $product->reseps()->delete();
            foreach ($data['recipe'] as $recipeItem) {
                $product->reseps()->create([
                    'bahan_baku_id' => $recipeItem['bahan_baku_id'],
                    'qty' => $recipeItem['qty'],
                ]);
            }
        });

        return redirect()->route('products.index')->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Produk $product) {
        $product->delete();
        return redirect()->route('products.index')->with('success', 'Produk berhasil dihapus.');
    }
}

