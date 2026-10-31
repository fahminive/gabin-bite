<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan index pada kolom yang sering diquery oleh DashboardController
     * agar query rentang tanggal dan join di Supabase menjadi lebih cepat.
     */
    public function up(): void
    {
        $indexes = [
            // kash: query rentang tanggal + agregasi masuk/keluar
            ['table' => 'kash', 'columns' => ['tanggal'], 'name' => 'kash_tanggal_index'],
            ['table' => 'kash', 'columns' => ['created_at'], 'name' => 'kash_created_at_index'],
            ['table' => 'kash', 'columns' => ['sumber'], 'name' => 'kash_sumber_index'],

            // penjualans: query rentang tanggal + status
            ['table' => 'penjualans', 'columns' => ['created_at'], 'name' => 'penjualans_created_at_index'],
            ['table' => 'penjualans', 'columns' => ['status'], 'name' => 'penjualans_status_index'],
            ['table' => 'penjualans', 'columns' => ['pre_order_id'], 'name' => 'penjualans_pre_order_id_index'],

            // pembelians: query rentang tanggal
            ['table' => 'pembelians', 'columns' => ['created_at'], 'name' => 'pembelians_created_at_index'],
            ['table' => 'pembelians', 'columns' => ['pre_order_id'], 'name' => 'pembelians_pre_order_id_index'],

            // pengeluaran_operasionals: query rentang tanggal
            ['table' => 'pengeluaran_operasionals', 'columns' => ['tanggal'], 'name' => 'pengeluaran_operasionals_tanggal_index'],
            ['table' => 'pengeluaran_operasionals', 'columns' => ['created_at'], 'name' => 'pengeluaran_operasionals_created_at_index'],

            // detail_penjualans: join dengan penjualans dan produk
            ['table' => 'detail_penjualans', 'columns' => ['penjualan_id'], 'name' => 'detail_penjualans_penjualan_id_index'],
            ['table' => 'detail_penjualans', 'columns' => ['produk_id'], 'name' => 'detail_penjualans_produk_id_index'],

            // produksis: query rentang tanggal
            ['table' => 'produksis', 'columns' => ['tanggal'], 'name' => 'produksis_tanggal_index'],
            ['table' => 'produksis', 'columns' => ['produk_id'], 'name' => 'produksis_produk_id_index'],

            // pemakaian_bahans: join dengan produksis dan bahan_bakus
            ['table' => 'pemakaian_bahans', 'columns' => ['produksi_id'], 'name' => 'pemakaian_bahans_produksi_id_index'],
            ['table' => 'pemakaian_bahans', 'columns' => ['bahan_baku_id'], 'name' => 'pemakaian_bahans_bahan_baku_id_index'],

            // bahan_bakus: stok < 10
            ['table' => 'bahan_bakus', 'columns' => ['stok'], 'name' => 'bahan_bakus_stok_index'],

            // modals: query tanggal
            ['table' => 'modals', 'columns' => ['created_at'], 'name' => 'modals_created_at_index'],

            // peralatan: query tanggal beli
            ['table' => 'peralatans', 'columns' => ['tgl_beli'], 'name' => 'peralatans_tgl_beli_index'],
        ];

        foreach ($indexes as $index) {
            $table = $index['table'];
            $columns = $index['columns'];
            $name = $index['name'];

            if (DB::connection()->getDriverName() === 'pgsql') {
                // PostgreSQL: CREATE INDEX IF NOT EXISTS
                $colList = implode('", "', $columns);
                DB::statement("CREATE INDEX IF NOT EXISTS \"{$name}\" ON \"{$table}\" (\"{$colList}\")");
            } else {
                // SQLite / others: use schema builder
                Schema::table($table, function (Blueprint $tableSchema) use ($name, $columns) {
                    $tableSchema->index($columns, $name);
                });
            }
        }
    }

    public function down(): void
    {
        $indexes = [
            ['table' => 'kash', 'name' => 'kash_tanggal_index'],
            ['table' => 'kash', 'name' => 'kash_created_at_index'],
            ['table' => 'kash', 'name' => 'kash_sumber_index'],
            ['table' => 'penjualans', 'name' => 'penjualans_created_at_index'],
            ['table' => 'penjualans', 'name' => 'penjualans_status_index'],
            ['table' => 'penjualans', 'name' => 'penjualans_pre_order_id_index'],
            ['table' => 'pembelians', 'name' => 'pembelians_created_at_index'],
            ['table' => 'pembelians', 'name' => 'pembelians_pre_order_id_index'],
            ['table' => 'pengeluaran_operasionals', 'name' => 'pengeluaran_operasionals_tanggal_index'],
            ['table' => 'pengeluaran_operasionals', 'name' => 'pengeluaran_operasionals_created_at_index'],
            ['table' => 'detail_penjualans', 'name' => 'detail_penjualans_penjualan_id_index'],
            ['table' => 'detail_penjualans', 'name' => 'detail_penjualans_produk_id_index'],
            ['table' => 'produksis', 'name' => 'produksis_tanggal_index'],
            ['table' => 'produksis', 'name' => 'produksis_produk_id_index'],
            ['table' => 'pemakaian_bahans', 'name' => 'pemakaian_bahans_produksi_id_index'],
            ['table' => 'pemakaian_bahans', 'name' => 'pemakaian_bahans_bahan_baku_id_index'],
            ['table' => 'bahan_bakus', 'name' => 'bahan_bakus_stok_index'],
            ['table' => 'modals', 'name' => 'modals_created_at_index'],
            ['table' => 'peralatans', 'name' => 'peralatans_tgl_beli_index'],
        ];

        foreach ($indexes as $index) {
            $table = $index['table'];
            $name = $index['name'];

            if (DB::connection()->getDriverName() === 'pgsql') {
                DB::statement("DROP INDEX IF EXISTS \"{$name}\"");
            } else {
                Schema::table($table, function (Blueprint $tableSchema) use ($name) {
                    $tableSchema->dropIndex($name);
                });
            }
        }
    }
};
