<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Penjualan PO boleh berdiri sendiri tanpa baris pelanggan:
        // nama pembeli disimpan sebagai teks opsional (bukan FK),
        // sedangkan pelanggan_id hanya menjadi kategori (umum/usaha/reseller).
        Schema::table('penjualans', function (Blueprint $table) {
            $table->string('nama_lengkap')->nullable()->after('pelanggan_id');

            // Nama constraint di Supabase: penjualans_pelanggan_id_fkey
            $table->dropForeign('penjualans_pelanggan_id_fkey');
            $table->foreignId('pelanggan_id')->nullable()->change();
            $table->foreign('pelanggan_id', 'penjualans_pelanggan_id_fkey')
                ->references('id')->on('pelanggans')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('penjualans', function (Blueprint $table) {
            $table->dropForeign('penjualans_pelanggan_id_fkey');
            $table->dropColumn('nama_lengkap');
            $table->dropColumn('pelanggan_id');
            $table->foreignId('pelanggan_id')->constrained()->onDelete('cascade');
        });
    }
};
