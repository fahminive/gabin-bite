<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PengeluaranOperasional extends Model
{
    protected $table = 'pengeluaran_operasionals';

    protected $guarded = [];

    public function preOrder(): BelongsTo
    {
        return $this->belongsTo(PreOrder::class);
    }

    public function mitra(): BelongsTo
    {
        return $this->belongsTo(Mitra::class);
    }

    public function metodePembayaran(): BelongsTo
    {
        return $this->belongsTo(MetodePembayaran::class);
    }

    public function kas()
    {
        return $this->morphOne(Kas::class, 'kasable');
    }

    public function splitTagihans(): HasMany
    {
        return $this->hasMany(SplitTagihan::class);
    }

    protected static function booted()
    {
        static::saved(function ($operasional) {
            $operasional->kas()->updateOrCreate(
                [],
                [
                    'tanggal' => $operasional->tanggal,
                    'keterangan' => 'Biaya ' . $operasional->kategori . ': ' . ($operasional->keterangan ?? 'Tanpa keterangan'),
                    'masuk' => 0,
                    'keluar' => $operasional->nominal,
                    'sumber' => 'operasional',
                ]
            );
        });

        static::deleted(function ($operasional) {
            if ($operasional->kas) {
                $operasional->kas->delete();
            }
        });
    }
}
