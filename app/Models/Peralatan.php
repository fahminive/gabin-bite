<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Peralatan extends Model
{
    protected $table = 'peralatans';

    protected $guarded = [];

    public function hutang(): HasOne
    {
        return $this->hasOne(Hutang::class);
    }
}
