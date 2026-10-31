<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PembayaranPiutang extends Model
{
    protected $table = 'pembayaran_piutangs';

    protected $guarded = [];

    public function piutang(): BelongsTo
    {
        return $this->belongsTo(Piutang::class);
    }

    public function kas()
    {
        return $this->morphOne(Kas::class, 'kasable');
    }

    protected static function booted()
    {
        static::deleted(function ($pembayaran) {
            if ($pembayaran->kas) {
                $pembayaran->kas->delete();
            }
        });
    }
}
