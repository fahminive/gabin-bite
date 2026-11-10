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

        // Terjual seumur hidup = qty pesanan yang sudah diserahkan ke pembeli;
        // belum diserahkan = qty pesanan yang masih menunggu produksi/serah terima.
        $terjual = DB::table('detail_penjualans as dp')
            ->join('penjualans as pj', 'pj.id', '=', 'dp.penjualan_id')
            ->where(function ($q) {
                $q->whereNotNull('pj.tanggal_diberikan')
                    ->orWhere('pj.status_penyerahan', 'sudah_diberikan');
            })
            ->groupBy('dp.produk_id')
            ->select('dp.produk_id', DB::raw('SUM(dp.qty) as total'))
            ->pluck('total', 'produk_id');

        $belumDiserahkan = DB::table('detail_penjualans as dp')
            ->join('penjualans as pj', 'pj.id', '=', 'dp.penjualan_id')
            ->whereNull('pj.tanggal_diberikan')
            ->where('pj.status_penyerahan', 'belum_diberikan')
            ->groupBy('dp.produk_id')
            ->select('dp.produk_id', DB::raw('SUM(dp.qty) as total'))
            ->pluck('total', 'produk_id');

        $products->each(function ($p) use ($terjual, $belumDiserahkan) {
            $p->terjual_seumur_hidup = (float) ($terjual[$p->id] ?? 0);
            $p->belum_diserahkan = (float) ($belumDiserahkan[$p->id] ?? 0);
        });

        // Rincian terjual per varian: qty + nilai (harga jual saat transaksi),
        // untuk tabel detail di bawah kartu ringkasan.
        $terjualPerVarian = DB::table('detail_penjualans as dp')
            ->join('penjualans as pj', 'pj.id', '=', 'dp.penjualan_id')
            ->join('produks as pr', 'pr.id', '=', 'dp.produk_id')
            ->where(function ($q) {
                $q->whereNotNull('pj.tanggal_diberikan')
                    ->orWhere('pj.status_penyerahan', 'sudah_diberikan');
            })
            ->groupBy('pr.id', 'pr.kode', 'pr.nama_produk', 'pr.satuan')
            ->orderBy('pr.kode')
            ->select(
                'pr.id as produk_id',
                'pr.kode',
                'pr.nama_produk',
                'pr.satuan',
                DB::raw('SUM(dp.qty) as qty_terjual'),
                DB::raw('SUM(dp.subtotal) as nilai_terjual'),
            )
            ->get()
            ->map(fn ($row) => [
                'produk_id' => (int) $row->produk_id,
                'kode' => $row->kode,
                'nama_produk' => $row->nama_produk,
                'satuan' => $row->satuan,
                'qty_terjual' => (float) $row->qty_terjual,
                'nilai_terjual' => (float) $row->nilai_terjual,
            ])
            ->all();

        return Inertia::render('Produk/Index', [
            'user' => 'Dashboard Produk',
            'products' => $products,
            'terjualSeumurHidup' => (float) $products->sum('terjual_seumur_hidup'),
            'belumDiserahkan' => (float) $products->sum('belum_diserahkan'),
            'terjualPerVarian' => $terjualPerVarian,
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
        $data['hpp'] = $this->hitungHppDariResep($data['recipe']); // HPP real-time dari resep

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
        $data['hpp'] = $this->hitungHppDariResep($data['recipe']); // HPP real-time dari resep

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

    /**
     * HPP = total biaya bahan resep (qty bisa koma) = SUM(qty_resep × harga_satuan bahan).
     * Satu query ringan ke bahan_bakus, input 'hpp' dari user selalu diabaikan.
     */
    private function hitungHppDariResep(array $recipe): float
    {
        $hargaBahan = BahanBaku::whereIn('id', collect($recipe)->pluck('bahan_baku_id'))
            ->pluck('harga_satuan', 'id');

        return round(collect($recipe)->sum(
            fn ($item) => (float) ($hargaBahan[$item['bahan_baku_id']] ?? 0) * (float) $item['qty']
        ), 2);
    }
}

