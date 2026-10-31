<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The original `metode_pembayarans.nama_metode` column was an enum
     * (tunai/utang) and PostgreSQL keeps its CHECK constraint even after the
     * column is changed to a plain string. SQLite rebuilds the table on
     * `change()` and silently drops it, so the two databases disagreed.
     *
     * Drop the stale constraint so any payment method name can be stored.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('alter table "metode_pembayarans" drop constraint if exists "metode_pembayarans_nama_metode_check"');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // The enum constraint is obsolete; there is nothing to restore.
    }
};
