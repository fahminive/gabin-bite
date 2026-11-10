<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fitur Biaya Operasional & Peralatan dihapus 100%.
     * Tabel, baris kas terkait, dan referensi lainnya dibersihkan.
     */
    public function up(): void
    {
        $this->dropTable('pengeluaran_operasionals');
        $this->dropTable('peralatans');

        // Kolom pengeluaran_operasional_id & peralatan_id yang tersisa
        // di tabel lain: bersihkan berikut referensi kasnya.
        $this->dropColumn('split_tagihans', 'pengeluaran_operasional_id');
        $this->dropColumn('hutangs', 'peralatan_id');

        // Baris kas yang dibuat dari biaya operasional / peralatan ikut dihapus.
        // Morph map menyimpan class name lengkap, cek keduanya.
        if (Schema::hasTable('kash')) {
            DB::table('kash')->whereIn('kasable_type', [
                'pengeluaran_operasionals',
                'peralatans',
                'App\\Models\\PengeluaranOperasional',
                'App\\Models\\Peralatan',
            ])->delete();
        }
    }

    private function dropTable(string $table): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        // PK pertama supaya baris anaknya tidak menggantung.
        // Drop FK yang masih merujuk tabel ini (Supabase menamai pola
        // {tabel}_{kolom}_fkey), termasuk hapus kolomnya agar tidak error.
        $dependents = DB::select(
            "SELECT DISTINCT t.relname AS table_name, a.attname AS column_name, c.conname
             FROM pg_constraint c
             JOIN pg_class t ON t.oid = c.conrelid
             JOIN pg_class ct ON ct.oid = c.confrelid
             JOIN unnest(c.conkey) AS ck ON true
             JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ck
             WHERE ct.relname = ? AND c.contype = 'f'",
            [$table]
        );

        foreach ($dependents as $dep) {
            // Baris anak yang masih merujuk dihapus (data fitur sudah tidak dipakai).
            DB::table($dep->table_name)->whereNotNull($dep->column_name)->delete();
            DB::statement("ALTER TABLE \"{$dep->table_name}\" DROP CONSTRAINT IF EXISTS \"{$dep->conname}\"");
            if (Schema::hasColumn($dep->table_name, $dep->column_name)) {
                Schema::table($dep->table_name, fn ($t) => $t->dropColumn($dep->column_name));
            }
        }

        Schema::dropIfExists($table);
    }

    private function dropColumn(string $table, string $column): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return;
        }

        DB::table($table)->whereNotNull($column)->delete();

        $cnames = DB::select(
            "SELECT t.relname AS table_name, c.conname
             FROM pg_constraint c
             JOIN pg_class t ON t.oid = c.conrelid
             JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
             WHERE t.relname = ? AND a.attname = ? AND c.contype = 'f'",
            [$table, $column]
        );

        foreach ($cnames as $row) {
            DB::statement("ALTER TABLE \"{$row->table_name}\" DROP CONSTRAINT IF EXISTS \"{$row->conname}\"");
        }

        Schema::table($table, fn ($t) => $t->dropColumn($column));
    }

    public function down(): void
    {
        // Tidak dibatalkan: fitur sudah dihapus permanen.
    }
};
