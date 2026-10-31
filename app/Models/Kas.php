<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kas extends Model
{
    protected $table = 'kash';

    protected $guarded = [];

    public function kasable()
    {
        return $this->morphTo();
    }

    protected static function booted()
    {
        static::creating(function ($kas) {
            if (empty($kas->kode)) {
                $lastRecord = static::orderBy('id', 'desc')->first();
                $nextId = 1;
                if ($lastRecord && preg_match('/-(\d+)$/', $lastRecord->kode, $matches)) {
                    $nextId = intval($matches[1]) + 1;
                } elseif ($lastRecord) {
                    $nextId = $lastRecord->id + 1;
                }
                $kas->kode = 'KAS-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
            }
        });
    }
}
