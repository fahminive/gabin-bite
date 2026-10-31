<?php

use App\Models\User;
use App\Models\Modal;
use App\Models\PengeluaranOperasional;
use App\Models\Kas;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

test('can create setoran modal and syncs cash ledger if cash type', function () {
    $data = [
        'nominal' => 10000000,
        'tipe' => 'Uang Tunai',
        'keterangan' => 'Modal awal tunai',
    ];

    $response = $this->post(route('modals.store'), $data);
    $response->assertRedirect(route('modals.index'));

    $this->assertDatabaseHas('modals', [
        'nominal' => 10000000,
        'tipe' => 'Uang Tunai',
    ]);

    // Check cash entry was auto-created
    $this->assertDatabaseHas('kash', [
        'masuk' => 10000000,
        'keluar' => 0,
        'sumber' => 'modal',
    ]);
});

test('does not sync cash ledger if modal is non-cash type', function () {
    $data = [
        'nominal' => 5000000,
        'tipe' => 'Peralatan / Aset',
        'keterangan' => 'Modal peralatan ruko',
    ];

    $this->post(route('modals.store'), $data);

    $this->assertDatabaseHas('modals', [
        'nominal' => 5000000,
        'tipe' => 'Peralatan / Aset',
    ]);

    // Cash entry should not exist
    $this->assertDatabaseMissing('kash', [
        'sumber' => 'modal',
    ]);
});

test('updating modal changes cash ledger matching entry or deletes it if type changes', function () {
    $modal = Modal::create([
        'nominal' => 5000000,
        'tipe' => 'Uang Tunai',
        'keterangan' => 'Modal awal',
    ]);

    // Should have cash record
    $this->assertDatabaseHas('kash', ['masuk' => 5000000]);

    // Update nominal
    $this->put(route('modals.update', $modal), [
        'nominal' => 7000000,
        'tipe' => 'Uang Tunai',
        'keterangan' => 'Modal awal revised',
    ]);

    $this->assertDatabaseHas('kash', ['masuk' => 7000000]);

    // Update type to non-cash
    $this->put(route('modals.update', $modal), [
        'nominal' => 7000000,
        'tipe' => 'Peralatan / Aset',
        'keterangan' => 'Modal awal revised',
    ]);

    $this->assertDatabaseMissing('kash', ['masuk' => 7000000]);
});

test('deleting modal deletes corresponding cash ledger entry', function () {
    $modal = Modal::create([
        'nominal' => 2500000,
        'tipe' => 'Uang Tunai',
        'keterangan' => 'Modal hapus',
    ]);

    $this->assertDatabaseHas('kash', ['masuk' => 2500000]);

    $this->delete(route('modals.destroy', $modal));

    $this->assertDatabaseMissing('modals', ['id' => $modal->id]);
    $this->assertDatabaseMissing('kash', ['masuk' => 2500000]);
});

test('can create operational expense and automatically deducts cash ledger', function () {
    $data = [
        'tanggal' => '2026-06-10',
        'kategori' => 'Utilitas (Listrik/Air)',
        'nominal' => 150000,
        'keterangan' => 'Listrik kantor',
    ];

    $response = $this->post(route('operational-expenses.store'), $data);
    $response->assertRedirect(route('operational-expenses.index'));

    $this->assertDatabaseHas('pengeluaran_operasionals', [
        'nominal' => 150000,
        'kategori' => 'Utilitas (Listrik/Air)',
    ]);

    $this->assertDatabaseHas('kash', [
        'masuk' => 0,
        'keluar' => 150000,
        'sumber' => 'operasional',
    ]);
});

test('deleting operational expense removes cash ledger record', function () {
    $expense = PengeluaranOperasional::create([
        'tanggal' => '2026-06-10',
        'kategori' => 'Gaji',
        'nominal' => 1200000,
        'keterangan' => 'Gaji Staff',
    ]);

    $this->assertDatabaseHas('kash', ['keluar' => 1200000]);

    $this->delete(route('operational-expenses.destroy', $expense));

    $this->assertDatabaseMissing('pengeluaran_operasionals', ['id' => $expense->id]);
    $this->assertDatabaseMissing('kash', ['keluar' => 1200000]);
});

test('can record manual cash penyesuaian', function () {
    $data = [
        'tanggal' => '2026-06-10',
        'tipe_penyesuaian' => 'masuk',
        'nominal' => 20000,
        'keterangan' => 'Kelebihan kas fisik laci',
    ];

    $response = $this->post(route('cash.store'), $data);
    $response->assertRedirect(route('cash.index'));

    $this->assertDatabaseHas('kash', [
        'masuk' => 20000,
        'keluar' => 0,
        'sumber' => 'lainnya',
    ]);
});

test('can delete manual cash penyesuaian but cannot delete automatic entries', function () {
    // 1. Manual entry
    $manual = Kas::create([
        'tanggal' => '2026-06-10',
        'keterangan' => 'Manual',
        'masuk' => 5000,
        'keluar' => 0,
        'sumber' => 'lainnya',
    ]);

    // 2. Automatic entry from a modal (needs mock relation structure or just create manually with mock source)
    $auto = Kas::create([
        'tanggal' => '2026-06-10',
        'keterangan' => 'Auto',
        'masuk' => 10000,
        'keluar' => 0,
        'sumber' => 'modal',
    ]);

    // Try deleting manual
    $responseManual = $this->delete(route('cash.destroy', $manual));
    $responseManual->assertRedirect(route('cash.index'));
    $this->assertDatabaseMissing('kash', ['id' => $manual->id]);

    // Try deleting auto
    $responseAuto = $this->delete(route('cash.destroy', $auto));
    $responseAuto->assertRedirect(route('cash.index'));
    $this->assertDatabaseHas('kash', ['id' => $auto->id]);
});
