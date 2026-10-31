<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pembelian extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function detailPembelians()
    {
        return $this->hasMany(DetailPembelian::class);
    }

    public function pemasok()
    {
        return $this->belongsTo(Pemasok::class);
    }

    public function kas()
    {
        return $this->morphOne(Kas::class, 'kasable');
    }

    public function hutang()
    {
        return $this->hasOne(Hutang::class);
    }

    public function mitra()
    {
        return $this->belongsTo(Mitra::class);
    }

    public function preOrder()
    {
        return $this->belongsTo(PreOrder::class);
    }

    public function splitTagihans()
    {
        return $this->hasMany(SplitTagihan::class);
    }

    protected static function booted()
    {
        static::deleted(function ($pembelian) {
            if ($pembelian->kas) {
                $pembelian->kas->delete();
            }
        });
    }
}