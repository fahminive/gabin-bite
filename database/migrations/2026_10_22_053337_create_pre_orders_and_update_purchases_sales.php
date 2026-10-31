<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pre_orders', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('keterangan'); // contoh: 'Batch 1', 'PO Spesial Idul Fitri', dll.
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->enum('status', ['buka', 'tutup', 'selesai'])->default('buka');
            $table->timestamps();
        });

        Schema::table('pembelians', function (Blueprint $table) {
            $table->foreignId('pre_order_id')->nullable()->after('mitra_id')->constrained('pre_orders')->nullOnDelete();
        });

        Schema::table('penjualans', function (Blueprint $table) {
            $table->foreignId('pre_order_id')->nullable()->after('metode_pembayaran_id')->constrained('pre_orders')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('penjualans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pre_order_id');
        });

        Schema::table('pembelians', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pre_order_id');
        });

        Schema::dropIfExists('pre_orders');
    }
};
