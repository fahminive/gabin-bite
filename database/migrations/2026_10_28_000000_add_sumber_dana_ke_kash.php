<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan informasi sumber dana pada penyesuaian kas manual:
     * apakah dana berasal dari simpanan usaha (bisnis) atau uang pribadi
     * salah satu member tim (mitra).
     */
    public function up(): void
    {
        Schema::table('kash', function (Blueprint $table) {
            $table->string('sumber_dana')->nullable()->after('sumber'); // 'simpanan_usaha' | 'pribadi'
            $table->unsignedBigInteger('mitra_id')->nullable()->after('sumber_dana');
        });

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("alter table \"kash\" add constraint \"kash_sumber_dana_check\" check (\"sumber_dana\" in ('simpanan_usaha', 'pribadi'))");
            DB::statement('alter table "kash" add constraint "kash_mitra_id_foreign" foreign key ("mitra_id") references "mitras"("id") on delete set null');
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('alter table "kash" drop constraint if exists "kash_mitra_id_foreign"');
            DB::statement('alter table "kash" drop constraint if exists "kash_sumber_dana_check"');
        }

        Schema::table('kash', function (Blueprint $table) {
            $table->dropColumn(['sumber_dana', 'mitra_id']);
        });
    }
};
