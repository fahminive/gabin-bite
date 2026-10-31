<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Penjualan extends Model
{
    protected $table = 'penjualans';

    protected $guarded = [];

    public function pelanggan(): BelongsTo
    {
        return $this->belongsTo(Pelanggan::class);
    }

    public function metodePembayaran(): BelongsTo
    {
        return $this->belongsTo(MetodePembayaran::class);
    }

    public function detailPenjualans(): HasMany
    {
        return $this->hasMany(DetailPenjualan::class);
    }

    public function preOrder(): BelongsTo
    {
        return $this->belongsTo(PreOrder::class);
    }

    public function piutang(): HasOne
    {
        return $this->hasOne(Piutang::class);
    }

    public function isOpenPreOrder(): bool
    {
        return $this->status !== 'selesai';
    }

    public function kas()
    {
        return $this->morphOne(Kas::class, 'kasable');
    }

    protected static function booted()
    {
        static::deleted(function ($penjualan) {
            if ($penjualan->kas) {
                $penjualan->kas->delete();
            }
        });
    }
}
