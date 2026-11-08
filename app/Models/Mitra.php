<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Mitra extends Model
{
    protected $guarded = ['id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pembelians(): HasMany
    {
        return $this->hasMany(Pembelian::class);
    }

    public function splitTagihans(): HasMany
    {
        return $this->hasMany(SplitTagihan::class);
    }

    public static function ensureTrio(): void
    {
        $defaults = [
            ['kode' => 'N', 'nama' => 'Nalwa', 'email' => 'nalwa@sikeju.com'],
            ['kode' => 'W', 'nama' => 'Widya', 'email' => 'widya@sikeju.com'],
            ['kode' => 'F', 'nama' => 'Fahmi', 'email' => 'fahmi@sikeju.com'],
        ];

        foreach ($defaults as $partner) {
            $user = User::firstOrCreate(
                ['email' => $partner['email']],
                [
                    'name' => $partner['nama'],
                    'password' => bcrypt('password123'),
                    'role' => 'owner',
                ]
            );

            $mitra = static::firstOrNew(['kode' => $partner['kode']]);
            // Tulis ke database hanya jika benar-benar berubah, supaya request
            // halaman tidak selalu menimbangkan UPDATE ke mitras/users.
            if (! $mitra->exists) {
                $mitra->nama = $partner['nama'];
                $mitra->user_id = $user->id;
                $mitra->save();
            } elseif ((int) $mitra->user_id !== (int) $user->id) {
                $mitra->user_id = $user->id;
                $mitra->save();
            }
        }
    }
}
