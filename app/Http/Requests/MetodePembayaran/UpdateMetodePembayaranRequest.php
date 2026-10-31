<?php

namespace App\Http\Requests\MetodePembayaran;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMetodePembayaranRequest extends FormRequest
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
            'kode' => 'required|string|max:20|unique:metode_pembayarans,kode,' . $this->route('payment_method')->id,
            'nama_metode' => 'required|string|min:3|max:100',
        ];
    }
}
