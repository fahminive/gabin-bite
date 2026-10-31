<?php

namespace App\Http\Requests\Modal;

use Illuminate\Foundation\Http\FormRequest;

class StoreModalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nominal' => 'required|numeric|min:0',
            'tipe' => 'required|string|in:Uang Tunai,Peralatan / Aset,Lainnya',
            'keterangan' => 'nullable|string',
        ];
    }
}
