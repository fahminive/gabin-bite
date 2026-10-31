<?php

use App\Models\User;
use App\Models\Produk;
use App\Models\Pelanggan;
use App\Models\MetodePembayaran;
use App\Models\Penjualan;
use App\Models\Piutang;
use App\Models\PembayaranPiutang;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    // Create master data
    $this->pelanggan = Pelanggan::create([
        'nama_pelanggan' => 'Budi Santoso',
        'no_telepon' => '08123456789',
    ]);

    $this->produk = Produk::create([
        'nama_produk' => 'Makaroni Keju Original',
        'stok' => 50,
        'satuan' => 'Pcs',
        'hpp' => 8000,
        'harga_jual' => 12000,
    ]);

    $this->metode = MetodePembayaran::create([
        'nama_metode' => 'Transfer Bank',
    ]);
});

test('can record cash sale and decreases product stock / increases cash ledger', function () {
    $data = [
        'pelanggan_id' => $this->pelanggan->id,
        'metode_pembayaran_id' => $this->metode->id,
        'no_faktur' => 'INV-TEST-001',
        'jenis_pembayaran' => 'Tunai',
        'items' => [
            [
                'produk_id' => $this->produk->id,
                'qty' => 5,
                'harga_satuan' => 12000,
            ]
        ]
    ];

    $response = $this->post(route('sales.store'), $data);
    $response->assertRedirect(route('sales.index'));

    $this->assertDatabaseHas('penjualans', [
        'no_faktur' => 'INV-TEST-001',
        'total' => 60000,
    ]);

    $this->assertDatabaseHas('detail_penjualans', [
        'produk_id' => $this->produk->id,
        'qty' => 5,
        'harga_satuan' => 12000,
    ]);

    // Check stock decremented
    $this->assertEquals(45, $this->produk->fresh()->stok); // 50 - 5

    // Check cash entry created
    $this->assertDatabaseHas('kash', [
        'masuk' => 60000,
        'keluar' => 0,
        'sumber' => 'penjualan',
    ]);
});

test('can record credit sale and decreases product stock / creates receivable without cash entry', function () {
    $data = [
        'pelanggan_id' => $this->pelanggan->id,
        'metode_pembayaran_id' => $this->metode->id,
        'no_faktur' => 'INV-TEST-002',
        'jenis_pembayaran' => 'Kredit',
        'tgl_jatuh_tempo' => '2026-07-11',
        'items' => [
            [
                'produk_id' => $this->produk->id,
                'qty' => 10,
                'harga_satuan' => 12000,
            ]
        ]
    ];

    $response = $this->post(route('sales.store'), $data);
    $response->assertRedirect(route('sales.index'));

    // Check receivable created
    $this->assertDatabaseHas('piutangs', [
        'nominal' => 120000,
        'status' => 'belum_lunas',
        'tgl_jatuh_tempo' => '2026-07-11',
    ]);

    // Check stock decremented
    $this->assertEquals(40, $this->produk->fresh()->stok); // 50 - 10

    // No cash entry
    $this->assertDatabaseMissing('kash', [
        'sumber' => 'penjualan',
        'masuk' => 120000,
    ]);
});

test('deleting a sale reverts stock and deletes corresponding cash or receivable ledger', function () {
    // 1. Setup a cash sale
    $sale = Penjualan::create([
        'pelanggan_id' => $this->pelanggan->id,
        'metode_pembayaran_id' => $this->metode->id,
        'no_faktur' => 'INV-DELETE-1',
        'total' => 36000,
    ]);

    $sale->detailPenjualans()->create([
        'produk_id' => $this->produk->id,
        'qty' => 3,
        'harga_satuan' => 12000,
        'subtotal' => 36000,
    ]);

    $sale->kas()->create([
        'tanggal' => '2026-06-11',
        'keterangan' => 'Sale',
        'masuk' => 36000,
        'keluar' => 0,
        'sumber' => 'penjualan'
    ]);

    // Simulate stock deduction
    $this->produk->decrement('stok', 3);

    // Call delete
    $response = $this->delete(route('sales.destroy', $sale));
    $response->assertRedirect(route('sales.index'));

    // Verify stock reverted
    $this->assertEquals(50, $this->produk->fresh()->stok);

    // Verify records deleted
    $this->assertDatabaseMissing('penjualans', ['id' => $sale->id]);
    $this->assertDatabaseMissing('kash', ['masuk' => 36000, 'sumber' => 'penjualan']);
});

test('can accept installment payments, increases cash ledger, and updates status to lunas when paid', function () {
    // Setup a credit sale
    $sale = Penjualan::create([
        'pelanggan_id' => $this->pelanggan->id,
        'metode_pembayaran_id' => $this->metode->id,
        'no_faktur' => 'INV-CREDIT-1',
        'total' => 100000,
    ]);

    $piutang = $sale->piutang()->create([
        'nominal' => 100000,
        'status' => 'belum_lunas',
        'tgl_jatuh_tempo' => '2026-07-11',
    ]);

    // 1. Pay first installment (40,000)
    $response1 = $this->post(route('receivables.pay', $piutang), [
        'tanggal' => '2026-06-11',
        'nominal_bayar' => 40000,
    ]);
    $response1->assertRedirect();

    $this->assertDatabaseHas('pembayaran_piutangs', [
        'piutang_id' => $piutang->id,
        'nominal_bayar' => 40000,
    ]);

    $this->assertDatabaseHas('kash', [
        'masuk' => 40000,
        'sumber' => 'piutang',
    ]);

    $this->assertEquals('belum_lunas', $piutang->fresh()->status);

    // 2. Pay remaining balance (60,000)
    $response2 = $this->post(route('receivables.pay', $piutang), [
        'tanggal' => '2026-06-12',
        'nominal_bayar' => 60000,
    ]);
    $response2->assertRedirect();

    $this->assertDatabaseHas('kash', [
        'masuk' => 60000,
        'sumber' => 'piutang',
    ]);

    // Status should be updated to lunas
    $this->assertEquals('lunas', $piutang->fresh()->status);
});
