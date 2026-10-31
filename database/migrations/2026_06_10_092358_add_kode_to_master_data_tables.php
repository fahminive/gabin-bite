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
        Schema::table('bahan_bakus', function (Blueprint $table) {
            $table->string('kode', 20)->unique()->nullable()->after('id');
        });
        Schema::table('produks', function (Blueprint $table) {
            $table->string('kode', 20)->unique()->nullable()->after('id');
        });
        Schema::table('pemasoks', function (Blueprint $table) {
            $table->string('kode', 20)->unique()->nullable()->after('id');
        });
        Schema::table('pelanggans', function (Blueprint $table) {
            $table->string('kode', 20)->unique()->nullable()->after('id');
        });
        Schema::table('peralatans', function (Blueprint $table) {
            $table->string('kode', 20)->unique()->nullable()->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bahan_bakus', function (Blueprint $table) {
            $table->dropColumn('kode');
        });
        Schema::table('produks', function (Blueprint $table) {
            $table->dropColumn('kode');
        });
        Schema::table('pemasoks', function (Blueprint $table) {
            $table->dropColumn('kode');
        });
        Schema::table('pelanggans', function (Blueprint $table) {
            $table->dropColumn('kode');
        });
        Schema::table('peralatans', function (Blueprint $table) {
            $table->dropColumn('kode');
        });
    }
};
