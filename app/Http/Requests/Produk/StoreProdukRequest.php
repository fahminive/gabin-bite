<?php

namespace App\Http\Requests\Produk;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProdukRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'kode' => 'required|string|max:20|unique:produks,kode',
            'nama_produk' => 'required|string|min:3|max:100',
            'stok' => 'nullable|numeric|min:0',
            'satuan'=> 'required|string',
            'hpp' => 'required|numeric|min:0',
            'harga_jual' => 'required|numeric|min:0',
            'recipe' => 'required|array|min:1',
            'recipe.*.bahan_baku_id' => 'required|exists:bahan_bakus,id',
            'recipe.*.qty' => 'required|integer|min:1',
        ];
    }
}
