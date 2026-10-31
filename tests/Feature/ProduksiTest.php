<?php

use App\Models\User;
use App\Models\Produk;
use App\Models\BahanBaku;
use App\Models\Produksi;
use App\Models\PemakaianBahan;
use App\Models\KoreksiStok;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    // Create a product
    $this->produk = Produk::create([
        'nama_produk' => 'Makaroni Keju Original',
        'stok' => 10,
        'satuan' => 'Pcs',
        'hpp' => 8000,
        'harga_jual' => 12000,
    ]);

    // Create raw materials
    $this->tepung = BahanBaku::create([
        'nama_bahan' => 'Tepung Terigu',
        'stok' => 100,
        'satuan' => 'Kg',
        'harga_satuan' => 12000,
    ]);

    $this->keju = BahanBaku::create([
        'nama_bahan' => 'Keju Cheddar',
        'stok' => 50,
        'satuan' => 'Kg',
        'harga_satuan' => 45000,
    ]);
});

test('can record production and decreases raw materials stock / increases product stock', function () {
    $data = [
        'tanggal' => '2026-06-11',
        'produk_id' => $this->produk->id,
        'qty_hasil' => 5,
        'keterangan' => 'Batch Pagi',
        'items' => [
            [
                'bahan_baku_id' => $this->tepung->id,
                'qty_bahan_dipakai' => 10,
            ],
            [
                'bahan_baku_id' => $this->keju->id,
                'qty_bahan_dipakai' => 5,
            ]
        ]
    ];

    $response = $this->post(route('productions.store'), $data);
    $response->assertRedirect(route('productions.index'));

    // Verify database entries
    $this->assertDatabaseHas('produksis', [
        'produk_id' => $this->produk->id,
        'qty_hasil' => 5,
    ]);

    $this->assertDatabaseHas('pemakaian_bahans', [
        'bahan_baku_id' => $this->tepung->id,
        'qty_bahan_dipakai' => 10,
    ]);

    $this->assertDatabaseHas('pemakaian_bahans', [
        'bahan_baku_id' => $this->keju->id,
        'qty_bahan_dipakai' => 5,
    ]);

    // Verify stock updates
    $this->assertEquals(15, $this->produk->fresh()->stok); // 10 + 5
    $this->assertEquals(90, $this->tepung->fresh()->stok); // 100 - 10
    $this->assertEquals(45, $this->keju->fresh()->stok);   // 50 - 5
});

test('deleting a production reverts stock updates and deletes records', function () {
    // Perform manual production recording
    $produksi = Produksi::create([
        'tanggal' => '2026-06-11',
        'produk_id' => $this->produk->id,
        'qty_hasil' => 5,
        'keterangan' => 'Batch Pagi',
    ]);

    $pemakaian1 = $produksi->pemakaianBahans()->create([
        'bahan_baku_id' => $this->tepung->id,
        'qty_bahan_dipakai' => 10,
    ]);

    $pemakaian2 = $produksi->pemakaianBahans()->create([
        'bahan_baku_id' => $this->keju->id,
        'qty_bahan_dipakai' => 5,
    ]);

    // Adjust stocks for the created production manually first to simulate initial state
    $this->produk->increment('stok', 5);
    $this->tepung->decrement('stok', 10);
    $this->keju->decrement('stok', 5);

    // Call delete
    $response = $this->delete(route('productions.destroy', $produksi));
    $response->assertRedirect(route('productions.index'));

    // Verify records deleted
    $this->assertDatabaseMissing('produksis', ['id' => $produksi->id]);
    $this->assertDatabaseMissing('pemakaian_bahans', ['id' => $pemakaian1->id]);
    $this->assertDatabaseMissing('pemakaian_bahans', ['id' => $pemakaian2->id]);

    // Verify stock reverted
    $this->assertEquals(10, $this->produk->fresh()->stok);  // 15 - 5
    $this->assertEquals(100, $this->tepung->fresh()->stok); // 90 + 10
    $this->assertEquals(50, $this->keju->fresh()->stok);    // 45 + 5
});

test('can record stock correction masuk and increases product stock', function () {
    $data = [
        'tanggal' => '2026-06-11',
        'produk_id' => $this->produk->id,
        'jenis_koreksi' => 'masuk',
        'qty' => 3,
        'keterangan' => 'Kelebihan fisik',
    ];

    $response = $this->post(route('stock-corrections.store'), $data);
    $response->assertRedirect(route('stock-corrections.index'));

    $this->assertDatabaseHas('koreksi_stoks', [
        'produk_id' => $this->produk->id,
        'jenis_koreksi' => 'masuk',
        'qty' => 3,
    ]);

    $this->assertEquals(13, $this->produk->fresh()->stok); // 10 + 3
});

test('can record stock correction keluar and decreases product stock', function () {
    $data = [
        'tanggal' => '2026-06-11',
        'produk_id' => $this->produk->id,
        'jenis_koreksi' => 'keluar',
        'qty' => 4,
        'keterangan' => 'Rusak / Basi',
    ];

    $response = $this->post(route('stock-corrections.store'), $data);
    $response->assertRedirect(route('stock-corrections.index'));

    $this->assertDatabaseHas('koreksi_stoks', [
        'produk_id' => $this->produk->id,
        'jenis_koreksi' => 'keluar',
        'qty' => 4,
    ]);

    $this->assertEquals(6, $this->produk->fresh()->stok); // 10 - 4
});

test('deleting a stock correction reverts stock changes', function () {
    $correction = KoreksiStok::create([
        'tanggal' => '2026-06-11',
        'produk_id' => $this->produk->id,
        'jenis_koreksi' => 'keluar',
        'qty' => 4,
        'keterangan' => 'Rusak / Basi',
    ]);

    // Apply stock change manually first
    $this->produk->decrement('stok', 4);

    $response = $this->delete(route('stock-corrections.destroy', $correction));
    $response->assertRedirect(route('stock-corrections.index'));

    $this->assertDatabaseMissing('koreksi_stoks', ['id' => $correction->id]);
    $this->assertEquals(10, $this->produk->fresh()->stok); // 6 + 4
});

test('can create product with recipe requirements and creates recipe entries in database', function () {
    $data = [
        'kode' => 'PRD-9999',
        'nama_produk' => 'Makaroni Keju Spicy',
        'stok' => 0,
        'satuan' => 'Pcs',
        'hpp' => 9000,
        'harga_jual' => 14000,
        'recipe' => [
            [
                'bahan_baku_id' => $this->tepung->id,
                'qty' => 3,
            ],
            [
                'bahan_baku_id' => $this->keju->id,
                'qty' => 1,
            ]
        ]
    ];

    $response = $this->post(route('products.store'), $data);
    $response->assertRedirect(route('products.index'));

    $this->assertDatabaseHas('produks', [
        'nama_produk' => 'Makaroni Keju Spicy',
        'satuan' => 'Pcs',
    ]);

    $this->assertDatabaseHas('reseps', [
        'bahan_baku_id' => $this->tepung->id,
        'qty' => 3,
    ]);

    $this->assertDatabaseHas('reseps', [
        'bahan_baku_id' => $this->keju->id,
        'qty' => 1,
    ]);
});

