<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Persiapan fitur pengantaran:
 * 1. Alamat & no. telepon pembeli pindah dari pelanggans (yang kini hanya
 *    kategori pembeli) ke penjualans, karena alamat relevan per transaksi
 *    pre-order, bukan per kategori.
 * 2. Koordinat (latitude/longitude) opsional di penjualans untuk fitur
 *    peta rute pengantaran; diisi otomatis bila user paste link Google
 *    Maps yang mengandung koordinat, atau manual via pin peta.
 * 3. Tabel settings untuk konfigurasi app (lokasi dapur sebagai titik
 *    awal rute, dsb).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('penjualans', function (Blueprint $table) {
            $table->text('alamat')->nullable()->after('nama_lengkap');
            $table->string('no_telepon')->nullable()->after('alamat');
            $table->decimal('latitude', 10, 7)->nullable()->after('no_telepon');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });

        Schema::table('pelanggans', function (Blueprint $table) {
            $table->dropColumn(['alamat', 'no_telepon']);
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');

        Schema::table('pelanggans', function (Blueprint $table) {
            $table->text('alamat')->nullable()->after('no_telepon');
            $table->string('no_telepon')->nullable()->after('nama_pelanggan');
        });

        Schema::table('penjualans', function (Blueprint $table) {
            $table->dropColumn(['alamat', 'no_telepon', 'latitude', 'longitude']);
        });
    }
};
