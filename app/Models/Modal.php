<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Modal extends Model
{
    protected $table = 'modals';

    protected $guarded = [];

    public function kas()
    {
        return $this->morphOne(Kas::class, 'kasable');
    }

    protected static function booted()
    {
        static::saved(function ($modal) {
            if ($modal->tipe === 'Uang Tunai') {
                $modal->kas()->updateOrCreate(
                    [],
                    [
                        'tanggal' => $modal->created_at ? $modal->created_at->toDateString() : now()->toDateString(),
                        'keterangan' => 'Setoran Modal: ' . ($modal->keterangan ?? 'Tanpa keterangan'),
                        'masuk' => $modal->nominal,
                        'keluar' => 0,
                        'sumber' => 'modal',
                    ]
                );
            } else {
                // If updated to non-Uang Tunai, delete associated cash entry
                $modal->kas()->delete();
            }
        });

        static::deleted(function ($modal) {
            $modal->kas()->delete();
        });
    }
}
