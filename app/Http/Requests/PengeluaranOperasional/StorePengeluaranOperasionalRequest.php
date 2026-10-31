<?php

namespace App\Http\Requests\PengeluaranOperasional;

use Illuminate\Foundation\Http\FormRequest;

class StorePengeluaranOperasionalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tanggal' => 'required|date',
            'kategori' => 'required|string|max:255',
            'nominal' => 'required|numeric|min:0',
            'keterangan' => 'nullable|string',
            'pre_order_id' => ['nullable', 'exists:pre_orders,id'],
            'mitra_id' => ['nullable', 'exists:mitras,id'],
            'metode_pembayaran_id' => ['nullable', 'exists:metode_pembayarans,id'],
            'is_bersama' => ['nullable', 'boolean'],
            'sumber_dana' => ['nullable', 'string'],
        ];
    }
}
