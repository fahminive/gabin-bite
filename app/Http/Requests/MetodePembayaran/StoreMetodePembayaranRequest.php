<?php

namespace App\Http\Requests\MetodePembayaran;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreMetodePembayaranRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'kode' => 'required|string|max:20|unique:metode_pembayarans,kode',
            'nama_metode' => 'required|string|min:3|max:100',
        ];
    }
}
