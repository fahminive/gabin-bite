<?php

namespace App\Http\Requests\Pelanggan;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePelangganRequest extends FormRequest
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
        $pelangganId = $this->route('customer')?->id ?? $this->route('pelanggan')?->id;
        return [
            'kode' => 'required|string|max:20|unique:pelanggans,kode,' . $pelangganId,
            'nama_pelanggan' => 'required|string|min:1|max:100',
            'no_telepon' => 'nullable|string|max:30',
            'alamat' => 'nullable|string',
        ];
    }
}
