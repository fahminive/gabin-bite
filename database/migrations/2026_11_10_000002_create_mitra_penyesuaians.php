<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Penyesuaian saldo partner secara manual (+/-), misal pengeluaran yang
     * tidak tercatat di pembelian bisa ditambahkan (+), pemasukan luar atau
     * potongan bisa dikurangi (-) — logika sama seperti penyesuaian stok.
     */
    public function up(): void
    {
        Schema::create('mitra_penyesuaians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mitra_id')->constrained('mitras')->cascadeOnDelete();
            $table->foreignId('pre_order_id')->nullable()->constrained('pre_orders')->nullOnDelete();
            // Nominal bisa negatif: plus = partner keluar tambahan, minus = potongan/masukan.
            $table->decimal('nominal', 14, 2);
            $table->date('tanggal');
            $table->string('keterangan')->nullable();
            $table->timestamps();

            $table->index(['mitra_id', 'tanggal']);
            $table->index(['pre_order_id', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mitra_penyesuaians');
    }
};
