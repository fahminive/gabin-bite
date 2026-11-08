<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Qty resep bisa koma (mis. 12.5 gram bahan per bungkus gabin).
        Schema::hasTable('reseps') && DB::statement(
            'ALTER TABLE "reseps" ALTER COLUMN "qty" TYPE numeric(12, 3)'
        );
    }

    public function down(): void
    {
        Schema::hasTable('reseps') && DB::statement(
            'ALTER TABLE "reseps" ALTER COLUMN "qty" TYPE integer USING round("qty")'
        );
    }
};
