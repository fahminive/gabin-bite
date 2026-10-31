<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mitra_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dari_mitra_id')->constrained('mitras')->cascadeOnDelete();
            $table->foreignId('ke_mitra_id')->constrained('mitras')->cascadeOnDelete();
            $table->decimal('nominal', 15, 2);
            $table->date('tanggal');
            $table->foreignId('pre_order_id')->nullable()->constrained('pre_orders')->nullOnDelete();
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mitra_transfers');
    }
};
