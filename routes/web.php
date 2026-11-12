<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\BahanBakuController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeliveryRouteController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\PemasokController;
use App\Http\Controllers\PelangganController;
use App\Http\Controllers\MetodePembayaranController;
use App\Http\Controllers\ModalController;
use App\Http\Controllers\KasController;
use App\Http\Controllers\PembelianController;
use App\Http\Controllers\ProduksiController;
use App\Http\Controllers\KoreksiStokController;
use App\Http\Controllers\PenjualanController;
use App\Http\Controllers\PreOrderController;
use App\Http\Controllers\SplitBillController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\UserController;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('reports/cash-flow', [LaporanController::class, 'cashFlow'])->name('reports.cash-flow');
    Route::get('reports/cash-flow/pdf', [LaporanController::class, 'cashFlowPdf'])->name('reports.cash-flow.pdf');
    Route::get('reports/income-statement', [LaporanController::class, 'incomeStatement'])->name('reports.income-statement');
    Route::get('reports/income-statement/pdf', [LaporanController::class, 'incomeStatementPdf'])->name('reports.income-statement.pdf');
    Route::get('reports/balance-sheet', [LaporanController::class, 'balanceSheet'])->name('reports.balance-sheet');
    Route::get('reports/balance-sheet/pdf', [LaporanController::class, 'balanceSheetPdf'])->name('reports.balance-sheet.pdf');

    // Rute pengantaran (peta + optimasi urutan kunjungan)
    Route::get('delivery-route', [DeliveryRouteController::class, 'index'])->name('delivery-route.index');
    Route::get('delivery-route/batches/{batch}/stops', [DeliveryRouteController::class, 'batchStops'])->name('delivery-route.stops');
    Route::post('delivery-route/stops/point', [DeliveryRouteController::class, 'setStopPoint'])->name('delivery-route.set-point');
    Route::post('delivery-route/dapur', [DeliveryRouteController::class, 'setDapur'])->name('delivery-route.set-dapur');

    // Route Write
    Route::middleware(['role:admin,finance,owner'])->group(function () {
        // Master Data
        Route::resource('materials', BahanBakuController::class)->except(['index', 'show']);
        Route::resource('products', ProdukController::class)->except(['index', 'show']);
        Route::resource('suppliers', PemasokController::class)->except(['index', 'show']);
        Route::resource('customers', PelangganController::class)->except(['index', 'show']);
        Route::resource('payment-methods', MetodePembayaranController::class)->except(['index', 'show']);
        Route::resource('modals', ModalController::class)->except(['index', 'show']);
        Route::resource('cash', KasController::class)->only(['store', 'update', 'destroy']);

        // Transaksi
        Route::resource('purchases', PembelianController::class)->except(['index', 'show']);
        Route::resource('pre-orders', PreOrderController::class)->except(['index', 'show']);
        Route::resource('productions', ProduksiController::class)->except(['index', 'show']);
        Route::resource('stock-corrections', KoreksiStokController::class)->except(['index', 'show']);
        Route::resource('sales', PenjualanController::class)->except(['index', 'show']);
        Route::post('sales/{sale}/fulfill', [PenjualanController::class, 'fulfill'])->name('sales.fulfill');
        Route::patch('sales/{sale}/status', [PenjualanController::class, 'updateStatus'])->name('sales.status');
        Route::get('productions/{production}/usage', [ProduksiController::class, 'usage'])->name('productions.usage');
        Route::patch('split-bills/mitras/{mitra}', [SplitBillController::class, 'updateMitra'])->name('split-bills.mitras.update');
        Route::post('split-bills/transfers', [SplitBillController::class, 'storeTransfer'])->name('split-bills.transfers.store');
        Route::put('split-bills/transfers/{transfer}', [SplitBillController::class, 'updateTransfer'])->name('split-bills.transfers.update');
        Route::delete('split-bills/transfers/{transfer}', [SplitBillController::class, 'destroyTransfer'])->name('split-bills.transfers.destroy');
        Route::post('split-bills/adjustments', [SplitBillController::class, 'storeAdjustment'])->name('split-bills.adjustments.store');
        Route::put('split-bills/adjustments/{adjustment}', [SplitBillController::class, 'updateAdjustment'])->name('split-bills.adjustments.update');
        Route::delete('split-bills/adjustments/{adjustment}', [SplitBillController::class, 'destroyAdjustment'])->name('split-bills.adjustments.destroy');
        Route::post('split-bills/{splitTagihan}/settle', [SplitBillController::class, 'settle'])->name('split-bills.settle');
    });

    // Route Read
    // Master Data
    Route::resource('materials', BahanBakuController::class)->only(['index', 'show']);
    Route::resource('products', ProdukController::class)->only(['index', 'show']);
    Route::resource('suppliers', PemasokController::class)->only(['index', 'show']);
    Route::resource('customers', PelangganController::class)->only(['index', 'show']);
    Route::resource('payment-methods', MetodePembayaranController::class)->only(['index', 'show']);
    Route::resource('modals', ModalController::class)->only(['index', 'show']);
    Route::resource('cash', KasController::class)->only(['index']);

    // Transaksi
    Route::resource('purchases', PembelianController::class)->only(['index', 'show']);
    Route::resource('pre-orders', PreOrderController::class)->only(['index', 'show']);
    Route::resource('productions', ProduksiController::class)->only(['index', 'show']);
    Route::resource('stock-corrections', KoreksiStokController::class)->only(['index', 'show']);
    Route::resource('sales', PenjualanController::class)->only(['index', 'show']);
    Route::get('split-bills', [SplitBillController::class, 'index'])->name('split-bills.index');

    Route::middleware(['role:admin'])->group(function () {
        Route::resource('users', UserController::class);
    });
});

require __DIR__.'/settings.php';