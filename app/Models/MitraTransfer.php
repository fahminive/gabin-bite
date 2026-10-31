<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MitraTransfer extends Model
{
    protected $table = 'mitra_transfers';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'nominal' => 'decimal:2',
        ];
    }

    public function dariMitra(): BelongsTo
    {
        return $this->belongsTo(Mitra::class, 'dari_mitra_id');
    }

    public function keMitra(): BelongsTo
    {
        return $this->belongsTo(Mitra::class, 'ke_mitra_id');
    }

    public function preOrder(): BelongsTo
    {
        return $this->belongsTo(PreOrder::class);
    }
}
