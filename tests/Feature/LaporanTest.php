<?php

use App\Models\User;
use App\Models\Kas;
use App\Models\Penjualan;
use App\Models\Pelanggan;
use App\Models\MetodePembayaran;
use App\Models\Produk;
use App\Models\PengeluaranOperasional;
use App\Models\BahanBaku;
use App\Models\Peralatan;
use App\Models\Modal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    // Setup base master data
    $this->pelanggan = Pelanggan::create(['nama_pelanggan' => 'Pelanggan A', 'no_telepon' => '081']);
    $this->metode = MetodePembayaran::create(['nama_metode' => 'Tunai']);
    
    $this->produk = Produk::create([
        'nama_produk' => 'Makaroni Keju Pedas',
        'hpp' => 8000,
        'harga_jual' => 12000,
        'stok' => 0,
        'satuan' => 'pcs'
    ]);

    $this->bahan = BahanBaku::create([
        'nama_bahan' => 'Makaroni Mentah',
        'stok' => 0,
        'satuan' => 'kg',
        'harga_satuan' => 10000
    ]);
});

test('can render cash flow page and calculates correct numbers', function () {
    // Record Modal (Inflow)
    Modal::create([
        'nominal' => 5000000,
        'tipe' => 'Uang Tunai',
        'keterangan' => 'Modal Awal',
    ]);

    // Record Operasional (Outflow)
    PengeluaranOperasional::create([
        'tanggal' => now()->toDateString(),
        'kategori' => 'Listrik',
        'nominal' => 200000,
        'keterangan' => 'Bayar Listrik',
    ]);

    $response = $this->get(route('reports.cash-flow'));

    $response->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Reports/CashFlow')
            ->has('saldoAwal')
            ->where('inflows.modal', 5000000)
            ->where('outflows.operasional', 200000)
            ->where('saldoAkhir', 4800000)
        );
});

test('can render income statement page and calculates correct HPP and net profit', function () {
    // Create sales
    $sales = Penjualan::create([
        'pelanggan_id' => $this->pelanggan->id,
        'metode_pembayaran_id' => $this->metode->id,
        'no_faktur' => 'INV-001',
        'total' => 24000, // 2 items * 12000
    ]);

    $sales->detailPenjualans()->create([
        'produk_id' => $this->produk->id,
        'qty' => 2,
        'harga_satuan' => 12000,
        'subtotal' => 24000,
    ]);

    // Create operational expense
    PengeluaranOperasional::create([
        'tanggal' => now()->toDateString(),
        'kategori' => 'Listrik',
        'nominal' => 5000,
        'keterangan' => 'Listrik',
    ]);

    $response = $this->get(route('reports.income-statement'));

    // Expected:
    // Pendapatan = 24000
    // HPP = 2 * 8000 = 16000
    // Laba Kotor = 24000 - 16000 = 8000
    // Operasional = 5000
    // Laba Bersih = 8000 - 5000 = 3000

    $response->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Reports/IncomeStatement')
            ->where('pendapatan', 24000)
            ->where('hpp', 16000)
            ->where('labaKotor', 8000)
            ->where('operasional', 5000)
            ->where('labaBersih', 3000)
        );
});

test('can render balance sheet page and evaluates balance equation', function () {
    // 1. Initial capital
    Modal::create([
        'nominal' => 2000000,
        'tipe' => 'Uang Tunai',
        'keterangan' => 'Modal Awal',
    ]);

    // 2. Buy equipment (pure asset transfer in real accounting, let's create equipment)
    Peralatan::create([
        'nama_alat' => 'Wajan Besar',
        'harga_perolehan' => 300000,
        'tgl_beli' => now()->toDateString(),
        'umur_ekonomis' => 36,
        'status_alat' => 'layak_pakai',
    ]);

    // 3. To balance the Peralatan asset, we add it as Peralatan capital contribution (non-cash Modal)
    Modal::create([
        'nominal' => 300000,
        'tipe' => 'Peralatan / Aset',
        'keterangan' => 'Modal peralatan ruko',
    ]);

    $response = $this->get(route('reports.balance-sheet'));

    $response->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Reports/BalanceSheet')
            ->has('assets')
            ->has('liabilities')
            ->has('equity')
            ->where('isBalanced', true)
        );
});

test('can render tax report page and calculates correct flat 0.5% tax for CV', function () {
    // 1. Create sales
    $sales = Penjualan::create([
        'pelanggan_id' => $this->pelanggan->id,
        'metode_pembayaran_id' => $this->metode->id,
        'no_faktur' => 'INV-001',
        'total' => 100000,
        'created_at' => now(),
    ]);

    $sales->detailPenjualans()->create([
        'produk_id' => $this->produk->id,
        'qty' => 1,
        'harga_satuan' => 100000,
        'subtotal' => 100000,
    ]);

    // 2. Create paid tax in operational expenses
    PengeluaranOperasional::create([
        'tanggal' => now()->toDateString(),
        'kategori' => 'Pajak',
        'nominal' => 200,
        'keterangan' => 'Bayar PPh Januari',
    ]);

    // 3. Access tax report route
    $response = $this->get(route('reports.tax', ['year' => now()->year]));

    // Expected:
    // Omzet = 100000
    // Tax (0.5% flat) = 500
    // Paid = 200

    $response->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Reports/TaxReport')
            ->where('selectedYear', now()->year)
            ->where('yearlyTotalOmzet', 100000)
            ->where('yearlyTotalTax', 500)
            ->where('yearlyTotalPaidTax', 200)
            ->has('monthlyData')
        );
});

test('can download cash flow PDF', function () {
    $response = $this->get(route('reports.cash-flow.pdf'));
    $response->assertStatus(200);
    $response->assertHeader('content-type', 'application/pdf');
});

test('can download income statement PDF', function () {
    $response = $this->get(route('reports.income-statement.pdf'));
    $response->assertStatus(200);
    $response->assertHeader('content-type', 'application/pdf');
});

test('can download balance sheet PDF', function () {
    $response = $this->get(route('reports.balance-sheet.pdf'));
    $response->assertStatus(200);
    $response->assertHeader('content-type', 'application/pdf');
});

test('can download tax report PDF', function () {
    $response = $this->get(route('reports.tax.pdf', ['year' => now()->year]));
    $response->assertStatus(200);
    $response->assertHeader('content-type', 'application/pdf');
});


