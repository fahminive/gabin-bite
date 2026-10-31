<?php

namespace App\Services;

use App\Models\Mitra;
use App\Models\MitraTransfer;
use App\Models\Pembelian;
use App\Models\PengeluaranOperasional;
use App\Models\SplitTagihan;

class SplitBillService
{
    public function createForPembelian(Pembelian $pembelian): void
    {
        Mitra::ensureTrio();
        $mitras = Mitra::orderBy('kode')->get();

        if ($mitras->isEmpty()) {
            return;
        }

        // Preventing duplicate: remove any existing split rows for this purchase first.
        SplitTagihan::where('pembelian_id', $pembelian->id)->delete();

        $totalCents = (int) round(((float) $pembelian->total) * 100);
        $count = $mitras->count();
        $base = intdiv($totalCents, $count);
        $remainder = $totalCents % $count;

        $payerIndex = $mitras->search(fn (Mitra $mitra) => $mitra->id === $pembelian->mitra_id);
        if ($payerIndex === false) {
            $payerIndex = 0;
        }

        foreach ($mitras as $index => $mitra) {
            $shareCents = $base + ($index === $payerIndex ? $remainder : 0);
            $isPayer = $mitra->id === $pembelian->mitra_id;

            SplitTagihan::create([
                'pembelian_id' => $pembelian->id,
                'mitra_id' => $mitra->id,
                'bagian' => $shareCents / 100,
                'status' => $isPayer ? 'lunas' : 'belum_lunas',
                'lunas_at' => $isPayer ? now() : null,
            ]);
        }
    }

    public function createForOperasional(PengeluaranOperasional $operasional): void
    {
        if (! $operasional->is_bersama) {
            return;
        }

        Mitra::ensureTrio();
        $mitras = Mitra::orderBy('kode')->get();

        if ($mitras->isEmpty()) {
            return;
        }

        SplitTagihan::where('pengeluaran_operasional_id', $operasional->id)->delete();

        $totalCents = (int) round(((float) $operasional->nominal) * 100);
        $count = $mitras->count();
        $base = intdiv($totalCents, $count);
        $remainder = $totalCents % $count;

        $payerIndex = $mitras->search(fn (Mitra $mitra) => $mitra->id === $operasional->mitra_id);
        if ($payerIndex === false) {
            $payerIndex = 0;
        }

        foreach ($mitras as $index => $mitra) {
            $shareCents = $base + ($index === $payerIndex ? $remainder : 0);
            $isPayer = $operasional->mitra_id && $mitra->id === $operasional->mitra_id;

            SplitTagihan::create([
                'pembelian_id' => null,
                'pengeluaran_operasional_id' => $operasional->id,
                'mitra_id' => $mitra->id,
                'bagian' => $shareCents / 100,
                'status' => $isPayer ? 'lunas' : 'belum_lunas',
                'lunas_at' => $isPayer ? now() : null,
            ]);
        }
    }

    /**
     * Matriks tunggakan antar partner: berapa yang harus dibayar setiap member
     * ke member lain, berdasarkan split tagihan yang belum lunas.
     *
     * @return array{
     *     mitras: array<int,array{id:int,nama:string,kode:string}>,
     *     matrix: array<int,array<int,float>>,
     *     totalByDebtor: array<int,float>,
     *     totalByCreditor: array<int,float>,
     *     grandTotal: float
     * }
     */
    public function memberObligations(?int $preOrderId = null): array
    {
        Mitra::ensureTrio();
        $mitras = Mitra::orderBy('kode')->get();
        $ids = $mitras->pluck('id')->all();

        $matrix = [];
        $totalByDebtor = [];
        $totalByCreditor = [];
        foreach ($ids as $debtor) {
            $matrix[$debtor] = array_combine($ids, array_fill(0, count($ids), 0.0));
            $totalByDebtor[$debtor] = 0.0;
        }
        foreach ($ids as $creditor) {
            $totalByCreditor[$creditor] = 0.0;
        }

        $query = SplitTagihan::where('status', 'belum_lunas')
            ->whereNotNull('pembelian_id')
            ->with(['mitra', 'pembelian.mitra']);

        if ($preOrderId) {
            $query->whereHas('pembelian', fn ($sq) => $sq->where('pre_order_id', $preOrderId));
        }

        foreach ($query->get() as $tagihan) {
            $debtor = $tagihan->mitra_id;
            $creditor = $tagihan->pembelian->mitra_id;
            if (!$debtor || !$creditor || $debtor === $creditor) {
                continue;
            }
            $matrix[$debtor][$creditor] += (float) $tagihan->bagian;
            $totalByDebtor[$debtor] += (float) $tagihan->bagian;
            $totalByCreditor[$creditor] += (float) $tagihan->bagian;
        }

        return [
            'mitras' => $mitras->map(fn ($m) => ['id' => $m->id, 'nama' => $m->nama, 'kode' => $m->kode])->all(),
            'matrix' => $matrix,
            'totalByDebtor' => $totalByDebtor,
            'totalByCreditor' => $totalByCreditor,
            'grandTotal' => array_sum($totalByDebtor),
        ];
    }

    /**
     * @return array<int, array{id:int,nama:string,kode:string,user_id:?int,email:?string,dibayar:float,bagian:float,transfer_keluar:float,transfer_masuk:float,saldo:float}>
     */
    public function balances(?int $preOrderId = null): array
    {
        Mitra::ensureTrio();

        return Mitra::with('user')->orderBy('kode')->get()->map(function (Mitra $mitra) use ($preOrderId) {
            $pembelianQuery = $mitra->pembelians();
            $operasionalQuery = PengeluaranOperasional::where('mitra_id', $mitra->id);

            $splitQuery = $mitra->splitTagihans();

            if ($preOrderId) {
                $pembelianQuery->where('pre_order_id', $preOrderId);
                $operasionalQuery->where('pre_order_id', $preOrderId);
                $splitQuery->where(function ($q) use ($preOrderId) {
                    $q->whereHas('pembelian', fn ($sq) => $sq->where('pre_order_id', $preOrderId))
                        ->orWhereHas('pengeluaranOperasional', fn ($sq) => $sq->where('pre_order_id', $preOrderId));
                });
            }

            $dibayar = (float) $pembelianQuery->sum('total') + (float) $operasionalQuery->sum('nominal');
            $bagian = (float) $splitQuery->sum('bagian');

            $transferKeluarQuery = MitraTransfer::where('dari_mitra_id', $mitra->id);
            $transferMasukQuery = MitraTransfer::where('ke_mitra_id', $mitra->id);
            if ($preOrderId) {
                $transferKeluarQuery->where('pre_order_id', $preOrderId);
                $transferMasukQuery->where('pre_order_id', $preOrderId);
            }
            $transferKeluar = (float) $transferKeluarQuery->sum('nominal');
            $transferMasuk = (float) $transferMasukQuery->sum('nominal');

            return [
                'id' => $mitra->id,
                'nama' => $mitra->nama,
                'kode' => $mitra->kode,
                'user_id' => $mitra->user_id,
                'email' => $mitra->user?->email,
                'dibayar' => $dibayar,
                'bagian' => $bagian,
                'transfer_keluar' => $transferKeluar,
                'transfer_masuk' => $transferMasuk,
                'saldo' => $dibayar - $bagian + $transferMasuk - $transferKeluar,
            ];
        })->all();
    }
}
