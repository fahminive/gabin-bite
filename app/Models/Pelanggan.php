<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pelanggan extends Model
{
    protected $table = 'pelanggans';

    protected $guarded = [];

    public function penjualans(): HasMany
    {
        return $this->hasMany(Penjualan::class);
    }
}
