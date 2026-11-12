<?php

namespace Database\Seeders;

use App\Models\Pelanggan;
use Illuminate\Database\Seeder;

/**
 * Pelanggan tidak lagi menyimpan orang satu per satu.
 * Daftarnya hanya berisi kategori pembeli (umum/usaha/reseller);
 * nama orang ditulis langsung sebagai teks pada penjualan.
 */
class KategoriPelangganSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->categories() as $index => [$kode, $nama]) {
            Pelanggan::firstOrCreate(
                ['nama_pelanggan' => $nama],
                [
                    'kode' => $kode,
                ]
            );
        }
    }

    /**
     * @return array<int, array{0: string, 1: string}>
     */
    private function categories(): array
    {
        return [
            ['KAT-001', 'Umum'],
            ['KAT-002', 'Usaha'],
            ['KAT-003', 'Reseller'],
        ];
    }
}
