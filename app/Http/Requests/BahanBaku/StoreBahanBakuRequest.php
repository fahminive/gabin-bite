<?php

namespace App\Http\Requests\BahanBaku;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreBahanBakuRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'kode' => 'required|string|max:20|unique:bahan_bakus,kode',
            'nama_bahan' => 'required|string|min:3|max:100',
            'stok' => 'nullable|numeric|min:0',
            'satuan'=> 'required|string',
            'netto_pcs' => 'nullable|numeric|min:0',
            'harga_satuan' => 'required|numeric|min:1'
        ];
    }
}
