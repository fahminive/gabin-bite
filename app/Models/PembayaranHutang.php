<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PembayaranHutang extends Model
{
    protected $guarded = ['id'];

    public function hutang()
    {
        return $this->belongsTo(Hutang::class);
    }

    public function kas()
    {
        return $this->morphOne(Kas::class, 'kasable');
    }

    protected static function booted()
    {
        static::deleted(function ($pembayaranHutang) {
            if ($pembayaranHutang->kas) {
                $pembayaranHutang->kas->delete();
            }
        });
    }
}