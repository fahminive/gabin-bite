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
        Schema::table('peralatans', function (Blueprint $table) {
            $table->decimal('persentase_penyusutan', 5, 2)->default(0)->after('harga_perolehan')->comment('Persentase penyusutan per bulan, misal 0.42%');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peralatans', function (Blueprint $table) {
            $table->dropColumn('persentase_penyusutan');
        });
    }
};
