<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan kolom netto/pcs (gram atau ml per bungkus) pada master
     * bahan baku, digunakan saat pembelian per bungkus.
     */
    public function up(): void
    {
        Schema::table('bahan_bakus', function (Blueprint $table) {
            $table->decimal('netto_pcs', 12, 4)->nullable()->after('satuan');
        });
    }

    public function down(): void
    {
        Schema::table('bahan_bakus', function (Blueprint $table) {
            $table->dropColumn(['netto_pcs']);
        });
    }
};
