<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mitras', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 8)->unique();
            $table->string('nama');
            $table->timestamps();
        });

        Schema::table('pembelians', function (Blueprint $table) {
            $table->foreignId('mitra_id')->nullable()->after('pemasok_id')->constrained('mitras')->nullOnDelete();
            $table->string('sumber_dana')->default('pribadi')->after('total');
        });

        Schema::table('penjualans', function (Blueprint $table) {
            $table->string('status')->default('selesai')->after('total');
        });

        Schema::create('split_tagihans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pembelian_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mitra_id')->constrained()->cascadeOnDelete();
            $table->decimal('bagian', 15, 2);
            $table->string('status')->default('belum_lunas');
            $table->timestamp('lunas_at')->nullable();
            $table->timestamps();

            $table->unique(['pembelian_id', 'mitra_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('split_tagihans');

        Schema::table('penjualans', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('pembelians', function (Blueprint $table) {
            $table->dropConstrainedForeignId('mitra_id');
            $table->dropColumn('sumber_dana');
        });

        Schema::dropIfExists('mitras');
    }
};
