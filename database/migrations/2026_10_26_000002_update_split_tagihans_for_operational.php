<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('split_tagihans', function (Blueprint $table) {
            $table->foreignId('pengeluaran_operasional_id')->nullable()->after('pembelian_id')->constrained('pengeluaran_operasionals')->cascadeOnDelete();
            $table->unsignedBigInteger('pembelian_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('split_tagihans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pengeluaran_operasional_id');
            $table->unsignedBigInteger('pembelian_id')->nullable(false)->change();
        });
    }
};
