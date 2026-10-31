-- ============================================================================
-- GabinBite.pwt - Supabase Postgres Schema (from Laravel migrations)
-- Run in Supabase SQL Editor, search_path = gabinbite
-- Tables are ordered so foreign-key targets exist before referencing tables.
-- ============================================================================

SET search_path TO gabinbite, public;

-- --------------------------------------------------------
-- Level 0: No foreign-key dependencies
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "migrations" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "migration" VARCHAR(255) NOT NULL,
    "batch" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified_at" TIMESTAMP WITHOUT TIME ZONE,
    "password" VARCHAR(255) NOT NULL,
    "remember_token" VARCHAR(255),
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "two_factor_secret" TEXT,
    "two_factor_recovery_codes" TEXT,
    "two_factor_confirmed_at" TIMESTAMP WITHOUT TIME ZONE,
    "role" VARCHAR(255) NOT NULL DEFAULT 'finance'
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS "sessions" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" integer,
    "ip_address" VARCHAR(255),
    "user_agent" TEXT,
    "payload" TEXT NOT NULL,
    "last_activity" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS "sessions_user_id_index" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_last_activity_index" ON "sessions" ("last_activity");

CREATE TABLE IF NOT EXISTS "cache" (
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,
    "expiration" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS "cache_expiration_index" ON "cache" ("expiration");

CREATE TABLE IF NOT EXISTS "cache_locks" (
    "key" VARCHAR(255) NOT NULL,
    "owner" VARCHAR(255) NOT NULL,
    "expiration" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS "cache_locks_expiration_index" ON "cache_locks" ("expiration");

CREATE TABLE IF NOT EXISTS "jobs" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "queue" VARCHAR(255) NOT NULL,
    "payload" TEXT NOT NULL,
    "attempts" integer NOT NULL,
    "reserved_at" integer,
    "available_at" integer NOT NULL,
    "created_at" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS "jobs_queue_index" ON "jobs" ("queue");

CREATE TABLE IF NOT EXISTS "job_batches" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "total_jobs" integer NOT NULL,
    "pending_jobs" integer NOT NULL,
    "failed_jobs" integer NOT NULL,
    "failed_job_ids" TEXT NOT NULL,
    "options" TEXT,
    "cancelled_at" integer,
    "created_at" integer NOT NULL,
    "finished_at" integer
);

CREATE TABLE IF NOT EXISTS "failed_jobs" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "uuid" VARCHAR(255) NOT NULL,
    "connection" VARCHAR(255) NOT NULL,
    "queue" VARCHAR(255) NOT NULL,
    "payload" TEXT NOT NULL,
    "exception" TEXT NOT NULL,
    "failed_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL default CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "failed_jobs_connection_queue_failed_at_index" ON "failed_jobs" ("connection", "queue", "failed_at");
CREATE UNIQUE INDEX IF NOT EXISTS "failed_jobs_uuid_unique" ON "failed_jobs" ("uuid");

CREATE TABLE IF NOT EXISTS "kash" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "keterangan" TEXT,
    "masuk" NUMERIC NOT NULL,
    "keluar" NUMERIC NOT NULL,
    "sumber" VARCHAR(255) check ("sumber" in ('pembelian', 'penjualan', 'hutang', 'piutang', 'modal', 'peralatan', 'operasional', 'lainnya')) NOT NULL,
    "sumber_dana" VARCHAR(255) check ("sumber_dana" in ('simpanan_usaha', 'pribadi')),
    "mitra_id" integer,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "kode" VARCHAR(255),
    "tanggal" DATE,
    "kasable_type" VARCHAR(255),
    "kasable_id" integer,
    foreign key("mitra_id") references "mitras"("id") on delete set null
);

CREATE INDEX IF NOT EXISTS "kash_kasable_type_kasable_id_index" ON "kash" ("kasable_type", "kasable_id");
CREATE UNIQUE INDEX IF NOT EXISTS "kash_kode_unique" ON "kash" ("kode");

CREATE TABLE IF NOT EXISTS "peralatans" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "nama_alat" VARCHAR(255) NOT NULL,
    "harga_perolehan" NUMERIC NOT NULL,
    "tgl_beli" DATE NOT NULL,
    "umur_ekonomis" integer NOT NULL,
    "status_alat" VARCHAR(255) check ("status_alat" in ('layak_pakai', 'tidak_layak_pakai')) NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "kode" VARCHAR(255),
    "persentase_penyusutan" NUMERIC NOT NULL DEFAULT '0'
);

CREATE UNIQUE INDEX IF NOT EXISTS "peralatans_kode_unique" ON "peralatans" ("kode");

CREATE TABLE IF NOT EXISTS "modals" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "keterangan" TEXT,
    "nominal" NUMERIC NOT NULL,
    "tipe" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS "pemasoks" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "nama_pemasok" VARCHAR(255) NOT NULL,
    "no_telepon" VARCHAR(255),
    "alamat" TEXT,
    "keterangan" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "kode" VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS "pemasoks_kode_unique" ON "pemasoks" ("kode");

CREATE TABLE IF NOT EXISTS "bahan_bakus" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "nama_bahan" VARCHAR(255) NOT NULL,
    "stok" integer NOT NULL,
    "satuan" VARCHAR(255) NOT NULL,
    "netto_pcs" NUMERIC,
    "harga_satuan" NUMERIC NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "kode" VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS "bahan_bakus_kode_unique" ON "bahan_bakus" ("kode");

CREATE TABLE IF NOT EXISTS "pelanggans" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "nama_pelanggan" VARCHAR(255) NOT NULL,
    "no_telepon" VARCHAR(255),
    "alamat" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "kode" VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS "pelanggans_kode_unique" ON "pelanggans" ("kode");

CREATE TABLE IF NOT EXISTS "produks" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "nama_produk" VARCHAR(255) NOT NULL,
    "hpp" NUMERIC NOT NULL,
    "harga_jual" NUMERIC NOT NULL,
    "stok" integer NOT NULL,
    "satuan" VARCHAR(255),
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "kode" VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS "produks_kode_unique" ON "produks" ("kode");

CREATE TABLE IF NOT EXISTS "metode_pembayarans" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "nama_metode" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "kode" VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS "metode_pembayarans_kode_unique" ON "metode_pembayarans" ("kode");

CREATE TABLE IF NOT EXISTS "pre_orders" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "kode" VARCHAR(255) NOT NULL,
    "keterangan" VARCHAR(255) NOT NULL,
    "tanggal_mulai" DATE NOT NULL,
    "tanggal_selesai" DATE NOT NULL,
    "status" VARCHAR(255) check ("status" in ('buka', 'tutup', 'selesai')) NOT NULL DEFAULT 'buka',
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS "pre_orders_kode_unique" ON "pre_orders" ("kode");

-- --------------------------------------------------------
-- Level 1: Depends only on Level 0 tables
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "passkeys" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "credential_id" VARCHAR(255) NOT NULL,
    "credential" TEXT NOT NULL,
    "last_used_at" TIMESTAMP WITHOUT TIME ZONE,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("user_id") references "users"("id") on delete cascade
);

CREATE INDEX IF NOT EXISTS "passkeys_user_id_index" ON "passkeys" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "passkeys_credential_id_unique" ON "passkeys" ("credential_id");

CREATE TABLE IF NOT EXISTS "mitras" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "kode" VARCHAR(255) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "user_id" integer,
    foreign key("user_id") references "users"("id") on delete set null
);

CREATE UNIQUE INDEX IF NOT EXISTS "mitras_kode_unique" ON "mitras" ("kode");

CREATE TABLE IF NOT EXISTS "reseps" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "produk_id" integer NOT NULL,
    "bahan_baku_id" integer NOT NULL,
    "qty" integer NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("produk_id") references "produks"("id") on delete cascade,
    foreign key("bahan_baku_id") references "bahan_bakus"("id") on delete cascade
);

CREATE TABLE IF NOT EXISTS "produksis" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "tanggal" DATE NOT NULL,
    "produk_id" integer NOT NULL,
    "qty_hasil" integer NOT NULL,
    "keterangan" TEXT NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("produk_id") references "produks"("id") on delete cascade
);

CREATE TABLE IF NOT EXISTS "koreksi_stoks" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "produk_id" integer NOT NULL,
    "tanggal" DATE NOT NULL,
    "jenis_koreksi" VARCHAR(255) check ("jenis_koreksi" in ('masuk', 'keluar')) NOT NULL,
    "qty" integer NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("produk_id") references "produks"("id") on delete cascade
);

-- --------------------------------------------------------
-- Level 2: Depends on Level 0 and Level 1 tables
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "pembelians" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "metode_pembayaran_id" integer NOT NULL,
    "pemasok_id" integer NOT NULL,
    "nama_pembelian" VARCHAR(255) NOT NULL,
    "total" NUMERIC NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "mitra_id" integer,
    "sumber_dana" VARCHAR(255) NOT NULL DEFAULT 'pribadi',
    "pre_order_id" integer,
    foreign key("mitra_id") references mitras("id") on delete set null on update no action,
    foreign key("metode_pembayaran_id") references metode_pembayarans("id") on delete cascade on update no action,
    foreign key("pemasok_id") references pemasoks("id") on delete cascade on update no action,
    foreign key("pre_order_id") references "pre_orders"("id") on delete set null
);

CREATE TABLE IF NOT EXISTS "penjualans" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "pelanggan_id" integer NOT NULL,
    "metode_pembayaran_id" integer NOT NULL,
    "no_faktur" VARCHAR(255) NOT NULL,
    "total" NUMERIC NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "status" VARCHAR(255) NOT NULL DEFAULT 'selesai',
    "pre_order_id" integer,
    "status_pembayaran" VARCHAR(255) NOT NULL DEFAULT 'belum_bayar',
    "status_penyerahan" VARCHAR(255) NOT NULL DEFAULT 'belum_diberikan',
    "tanggal_bayar" TIMESTAMP WITHOUT TIME ZONE,
    "tanggal_diberikan" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("metode_pembayaran_id") references metode_pembayarans("id") on delete cascade on update no action,
    foreign key("pelanggan_id") references pelanggans("id") on delete cascade on update no action,
    foreign key("pre_order_id") references "pre_orders"("id") on delete set null
);

CREATE TABLE IF NOT EXISTS "pengeluaran_operasionals" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "kategori" VARCHAR(255) NOT NULL,
    "nominal" NUMERIC NOT NULL,
    "keterangan" TEXT,
    "tanggal" DATE NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "pre_order_id" integer,
    "mitra_id" integer,
    "metode_pembayaran_id" integer,
    "is_bersama" BOOLEAN NOT NULL DEFAULT '0',
    "sumber_dana" VARCHAR(255) NOT NULL DEFAULT 'pribadi',
    foreign key("pre_order_id") references "pre_orders"("id") on delete set null,
    foreign key("mitra_id") references "mitras"("id") on delete set null,
    foreign key("metode_pembayaran_id") references "metode_pembayarans"("id") on delete set null
);

CREATE TABLE IF NOT EXISTS "mitra_transfers" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "dari_mitra_id" integer NOT NULL,
    "ke_mitra_id" integer NOT NULL,
    "nominal" NUMERIC NOT NULL,
    "tanggal" DATE NOT NULL,
    "pre_order_id" integer,
    "keterangan" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("dari_mitra_id") references "mitras"("id") on delete cascade,
    foreign key("ke_mitra_id") references "mitras"("id") on delete cascade,
    foreign key("pre_order_id") references "pre_orders"("id") on delete set null
);

-- --------------------------------------------------------
-- Level 3: Depends on Level 2 tables (pembelians, penjualans, etc.)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "hutangs" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "pembelian_id" integer,
    "peralatan_id" integer,
    "keterangan" TEXT,
    "nominal" NUMERIC NOT NULL,
    "status" VARCHAR(255) check ("status" in ('lunas', 'belum_lunas')) NOT NULL,
    "tgl_jatuh_tempo" DATE NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("pembelian_id") references "pembelians"("id") on delete cascade,
    foreign key("peralatan_id") references "peralatans"("id") on delete cascade
);

CREATE TABLE IF NOT EXISTS "detail_pembelians" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "pembelian_id" integer NOT NULL,
    "bahan_baku_id" integer NOT NULL,
    "qty" integer NOT NULL,
    "satuan" VARCHAR(255) NOT NULL,
    "harga_satuan" NUMERIC NOT NULL,
    "subtotal" NUMERIC NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("pembelian_id") references "pembelians"("id") on delete cascade,
    foreign key("bahan_baku_id") references "bahan_bakus"("id") on delete cascade
);

CREATE TABLE IF NOT EXISTS "piutangs" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "penjualan_id" integer NOT NULL,
    "nominal" NUMERIC NOT NULL,
    "status" VARCHAR(255) check ("status" in ('lunas', 'belum_lunas')) NOT NULL,
    "tgl_jatuh_tempo" DATE NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("penjualan_id") references "penjualans"("id") on delete cascade
);

CREATE TABLE IF NOT EXISTS "detail_penjualans" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "penjualan_id" integer NOT NULL,
    "produk_id" integer NOT NULL,
    "qty" integer NOT NULL,
    "harga_satuan" NUMERIC NOT NULL,
    "subtotal" NUMERIC NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("penjualan_id") references "penjualans"("id") on delete cascade,
    foreign key("produk_id") references "produks"("id") on delete cascade
);

CREATE TABLE IF NOT EXISTS "split_tagihans" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "pembelian_id" integer,
    "mitra_id" integer NOT NULL,
    "bagian" NUMERIC NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'belum_lunas',
    "lunas_at" TIMESTAMP WITHOUT TIME ZONE,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    "pengeluaran_operasional_id" integer,
    foreign key("mitra_id") references mitras("id") on delete cascade on update no action,
    foreign key("pembelian_id") references pembelians("id") on delete cascade on update no action,
    foreign key("pengeluaran_operasional_id") references "pengeluaran_operasionals"("id") on delete cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "split_tagihans_pembelian_id_mitra_id_unique" ON "split_tagihans" ("pembelian_id", "mitra_id");

CREATE TABLE IF NOT EXISTS "pemakaian_bahans" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "produksi_id" integer NOT NULL,
    "bahan_baku_id" integer NOT NULL,
    "qty_bahan_dipakai" integer NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("produksi_id") references "produksis"("id") on delete cascade,
    foreign key("bahan_baku_id") references "bahan_bakus"("id") on delete cascade
);

-- --------------------------------------------------------
-- Level 4: Depends on Level 3 tables
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "pembayaran_hutangs" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "hutang_id" integer NOT NULL,
    "nominal_bayar" NUMERIC NOT NULL,
    "tanggal" DATE NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("hutang_id") references "hutangs"("id") on delete cascade
);

CREATE TABLE IF NOT EXISTS "pembayaran_piutangs" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "piutang_id" integer NOT NULL,
    "nominal_bayar" NUMERIC NOT NULL,
    "tanggal" DATE NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE,
    foreign key("piutang_id") references "piutangs"("id") on delete cascade
);

-- --------------------------------------------------------
-- Verification
-- --------------------------------------------------------

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'gabinbite'
ORDER BY table_name;
