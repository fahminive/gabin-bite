<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Produk extends Model
{
    protected $table = 'produks';

    protected $guarded = [];

    public function detailPenjualans(): HasMany
    {
        return $this->hasMany(DetailPenjualan::class);
    }

    public function reseps(): HasMany
    {
        return $this->hasMany(Resep::class);
    }

    public function produksis(): HasMany
    {
        return $this->hasMany(Produksi::class);
    }

    public function koreksiStoks(): HasMany
    {
        return $this->hasMany(KoreksiStok::class);
    }
}
