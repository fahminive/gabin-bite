<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SplitTagihan extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'bagian' => 'decimal:2',
            'lunas_at' => 'datetime',
        ];
    }

    public function pembelian(): BelongsTo
    {
        return $this->belongsTo(Pembelian::class);
    }

    public function pengeluaranOperasional(): BelongsTo
    {
        return $this->belongsTo(PengeluaranOperasional::class);
    }

    public function mitra(): BelongsTo
    {
        return $this->belongsTo(Mitra::class);
    }
}
