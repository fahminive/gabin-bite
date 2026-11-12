<?php

namespace App\Http\Controllers;

use App\Models\PreOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Fitur Rute Pengantaran: susun urutan kunjungan efisien dari titik
 * dapur ke para pembeli PO berstatus belum diserahkan.
 *
 * Koordinat pembeli diambil dari kolom latitude/longitude penjualans
 * (diisi via paste link Google Maps). Pembeli yang hanya alamat teks
 * diestimasi titiknya via Nominatim di sisi client saat pertama kali
 * dicari, lalu bisa digeser manual di peta.
 */
class DeliveryRouteController extends Controller
{
    public function index(Request $request): Response
    {
        $batches = PreOrder::orderByDesc('created_at')->get(['id', 'kode', 'keterangan', 'status']);

        return Inertia::render('DeliveryRoute/Index', [
            'batches' => $batches,
            'dapur' => $this->getDapur(),
        ]);
    }

    /**
     * Pembeli satu batch yang belum diserahkan + koordinatnya.
     */
    public function batchStops(Request $request, PreOrder $batch): \Illuminate\Http\JsonResponse
    {
        $stops = DB::table('penjualans')
            ->where('pre_order_id', $batch->id)
            ->where('status_penyerahan', 'belum_diberikan')
            ->orderBy('id')
            ->get([
                'id',
                'no_faktur',
                'nama_lengkap',
                'alamat',
                'no_telepon',
                'latitude',
                'longitude',
            ])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'no_faktur' => $row->no_faktur,
                'nama' => $row->nama_lengkap ?? 'Tanpa nama',
                'alamat' => $row->alamat,
                'no_telepon' => $row->no_telepon,
                'latitude' => $row->latitude !== null ? (float) $row->latitude : null,
                'longitude' => $row->longitude !== null ? (float) $row->longitude : null,
                'punya_titik' => $row->latitude !== null && $row->longitude !== null,
            ])
            ->all();

        return response()->json(['stops' => $stops]);
    }

    /**
     * Simpan koordinat yang diestimasi/pinges manual supaya tidak perlu
     * mencari ulang di rute berikutnya.
     */
    public function setStopPoint(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'id' => 'required|exists:penjualans,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'alamat' => 'nullable|string|max:1000',
        ]);

        $update = [
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
        ];
        if (! empty($validated['alamat'])) {
            $update['alamat'] = $validated['alamat'];
        }

        DB::table('penjualans')->where('id', $validated['id'])->update($update);

        return response()->json(['ok' => true]);
    }

    /** Titik awal & akhir rute: lokasi dapur dari settings. */
    public function setDapur(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'nama' => 'nullable|string|max:100',
        ]);

        DB::table('settings')->updateOrInsert(
            ['key' => 'dapur'],
            [
                'value' => json_encode([
                    'latitude' => (float) $validated['latitude'],
                    'longitude' => (float) $validated['longitude'],
                    'nama' => $validated['nama'] ?? 'Dapur Gabin',
                ]),
                'updated_at' => now(),
            ],
        );

        return response()->json(['ok' => true]);
    }

    private function getDapur(): ?array
    {
        $row = DB::table('settings')->where('key', 'dapur')->first();

        return $row ? json_decode($row->value, true) : null;
    }
}
