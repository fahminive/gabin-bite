<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pelanggans', function (Blueprint $table) {
            $table->text('alamat')->nullable()->after('no_telepon');
        });

        Schema::table('penjualans', function (Blueprint $table) {
            $table->string('status_pembayaran')->default('belum_bayar')->after('status');
            $table->string('status_penyerahan')->default('belum_diberikan')->after('status_pembayaran');
            $table->dateTime('tanggal_bayar')->nullable()->after('status_penyerahan');
            $table->dateTime('tanggal_diberikan')->nullable()->after('tanggal_bayar');
        });

        Schema::table('pengeluaran_operasionals', function (Blueprint $table) {
            $table->foreignId('pre_order_id')->nullable()->after('tanggal')->constrained('pre_orders')->nullOnDelete();
            $table->foreignId('mitra_id')->nullable()->after('pre_order_id')->constrained('mitras')->nullOnDelete();
            $table->foreignId('metode_pembayaran_id')->nullable()->after('mitra_id')->constrained('metode_pembayarans')->nullOnDelete();
            $table->boolean('is_bersama')->default(false)->after('metode_pembayaran_id');
            $table->string('sumber_dana')->default('pribadi')->after('is_bersama');
        });
    }

    public function down(): void
    {
        Schema::table('pengeluaran_operasionals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('metode_pembayaran_id');
            $table->dropConstrainedForeignId('mitra_id');
            $table->dropConstrainedForeignId('pre_order_id');
            $table->dropColumn(['is_bersama', 'sumber_dana']);
        });

        Schema::table('penjualans', function (Blueprint $table) {
            $table->dropColumn(['tanggal_diberikan', 'tanggal_bayar', 'status_penyerahan', 'status_pembayaran']);
        });

        Schema::table('pelanggans', function (Blueprint $table) {
            $table->dropColumn('alamat');
        });
    }
};
