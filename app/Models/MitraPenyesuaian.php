<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MitraPenyesuaian extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'nominal' => 'decimal:2',
            'tanggal' => 'date',
        ];
    }

    public function mitra(): BelongsTo
    {
        return $this->belongsTo(Mitra::class);
    }

    public function preOrder(): BelongsTo
    {
        return $this->belongsTo(PreOrder::class);
    }
}
