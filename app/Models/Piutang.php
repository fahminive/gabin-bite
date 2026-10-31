<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Piutang extends Model
{
    protected $table = 'piutangs';

    protected $guarded = [];

    public function penjualan(): BelongsTo
    {
        return $this->belongsTo(Penjualan::class);
    }

    public function pembayaranPiutangs(): HasMany
    {
        return $this->hasMany(PembayaranPiutang::class);
    }
}
