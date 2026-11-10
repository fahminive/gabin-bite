<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PreOrder extends Model
{
    protected $table = 'pre_orders';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
        ];
    }

    public function pembelians(): HasMany
    {
        return $this->hasMany(Pembelian::class);
    }

    public function penjualans(): HasMany
    {
        return $this->hasMany(Penjualan::class);
    }
}
