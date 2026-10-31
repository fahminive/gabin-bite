<?php

namespace App\Http\Requests\Peralatan;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePeralatanRequest extends FormRequest
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
            'kode' => 'required|string|max:20|unique:peralatans,kode',
            'nama_alat' => 'required|string|min:3|max:100',
            'harga_perolehan' => 'required|numeric|min:0',
            'tgl_beli' => 'required|date',
            'umur_ekonomis' => 'required|integer|min:1',
            'persentase_penyusutan' => 'required|numeric|min:0|max:100',
            'status_alat' => 'required|in:layak_pakai,tidak_layak_pakai',
        ];
    }
}
