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
        Schema::table('kash', function (Blueprint $table) {
            $table->string('kode', 20)->nullable()->unique()->after('id');
            $table->date('tanggal')->nullable()->after('kode');
            $table->nullableMorphs('kasable');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kash', function (Blueprint $table) {
            $table->dropMorphs('kasable');
            $table->dropColumn(['tanggal', 'kode']);
        });
    }
};
