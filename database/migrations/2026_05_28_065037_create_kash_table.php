<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('kash', function (Blueprint $table) {
            $table->id();
            $table->text('keterangan')->nullable();
            $table->decimal('masuk', 12);
            $table->decimal('keluar',12);
            $table->enum('sumber', ['pembelian','penjualan','hutang','piutang','modal','peralatan','operasional','lainnya']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kash');
    }
};
