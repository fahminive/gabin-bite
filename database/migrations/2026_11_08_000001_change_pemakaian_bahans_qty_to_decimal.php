<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pemakaian bahan dihitung dari qty resep (boleh koma) × qty_hasil,
        // jadi juga harus mendukung desimal.
        Schema::hasTable('pemakaian_bahans') && DB::statement(
            'ALTER TABLE "pemakaian_bahans" ALTER COLUMN "qty_bahan_dipakai" TYPE numeric(12, 3)'
        );
    }

    public function down(): void
    {
        Schema::hasTable('pemakaian_bahans') && DB::statement(
            'ALTER TABLE "pemakaian_bahans" ALTER COLUMN "qty_bahan_dipakai" TYPE integer USING round("qty_bahan_dipakai")'
        );
    }
};
