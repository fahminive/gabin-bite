<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pemasok extends Model
{
    protected $table = 'pemasoks';

    protected $guarded = [];

    public function pembelians(): HasMany
    {
        return $this->hasMany(Pembelian::class);
    }
}
