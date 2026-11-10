<?php

namespace App\Services;

use App\Models\Kas;
use App\Models\Mitra;
use App\Models\MitraPenyesuaian;
use App\Models\MitraTransfer;
use App\Models\Pembelian;
use App\Models\SplitTagihan;
use Illuminate\Support\Facades\DB;

/**
 * Semua perhitungan dipindah ke agregasi SQL ringkas (indexed SUM/GROUP BY).
 * Tidak ada lagi loop per-mitra yang menembak query satu per satu (N+1),
 * penyebab utama timeout 30 detik saat Vercel → Supabase.
 */
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

    /**
     * Baca saja info mitra (N, W, F) dalam skin SELEKTIF:
     * hanya SELECT mitra + user, tanpa menulis apa pun ke database.
     */
    private function mitrasWithUsers()
    {
        Mitra::ensureTrio();

        return Mitra::with('user:id,name,email')->orderBy('kode')->get();
    }

    /**
     * Siapa menalangi apa: beberapa query GROUP BY menghitung total yang
     * ditanggung/terutang setiap partner dari pembelian (belanja),
     * bagian patungan, kas dana pribadi, dan penyesuaian manual.
     *
     * @return array<int, array{total_belanja?:float, total_bagian_patungan?:float, dana_pribadi_masuk?:float, dana_pribadi_keluar?:float, penyesuaian?:float}>
     */
    private function partnerFlowSums(?int $preOrderId = null): array
    {
        $rows = [];

        // 1. Belanja ditalangi partner (pembelian.mitra_id)
        $belanja = Pembelian::query()
            ->when($preOrderId, fn ($q) => $q->where('pre_order_id', $preOrderId))
            ->groupBy('mitra_id')
            ->select('mitra_id', DB::raw('SUM("total") as total'))
            ->pluck('total', 'mitra_id');

        foreach ($belanja as $mitraId => $total) {
            $rows[(int) $mitraId]['total_belanja'] = (float) $total;
        }

        // 2. Bagian patungan per partner (split_tagihans — parent punya pre_order_id)
        $parentPreOrder = $preOrderId
            ? "pb.\"pre_order_id\" = {$preOrderId}"
            : '1 = 1';

        $splitRows = DB::table('split_tagihans as st')
            ->join('pembelians as pb', 'pb.id', '=', 'st.pembelian_id')
            ->whereRaw($parentPreOrder)
            ->groupBy('st.mitra_id')
            ->select('st.mitra_id', DB::raw('SUM(st.bagian) as total'))
            ->get();

        foreach ($splitRows as $row) {
            $rows[(int) $row->mitra_id]['total_bagian_patungan'] = (float) $row->total;
        }

        // 3. Arus kas dana pribadi partner (penyesuaian kas manual sumber 'pribadi'):
        //    setoran pribadi (masuk) menambah "dana talangan", penarikan (keluar) mengurangi.
        //    Baris penyesuaian manual tidak punya tautan batch, jadi hanya dihitung
        //    di tampilan global (tanpa filter batch).
        if (! $preOrderId) {
            $kasPribadi = Kas::query()
                ->where('sumber_dana', 'pribadi')
                ->whereNotNull('mitra_id')
                ->groupBy('mitra_id')
                ->selectRaw('"mitra_id",
                    SUM(CASE WHEN "masuk" > 0 THEN "masuk" ELSE 0 END) as total_masuk,
                    SUM(CASE WHEN "keluar" > 0 THEN "keluar" ELSE 0 END) as total_keluar')
                ->get();

            foreach ($kasPribadi as $row) {
                $rows[(int) $row->mitra_id]['dana_pribadi_masuk'] = (float) $row->total_masuk;
                $rows[(int) $row->mitra_id]['dana_pribadi_keluar'] = (float) $row->total_keluar;
            }
        }

        // 4. Penyesuaian manual per partner (+/-): pengeluaran yang tidak tercatat
        //    dari pembelian bisa diisi (+), pemasukan/potongan bisa dikurangi (-).
        $penyesuaian = MitraPenyesuaian::query()
            ->when($preOrderId, fn ($q) => $q->where('pre_order_id', $preOrderId))
            ->groupBy('mitra_id')
            ->select('mitra_id', DB::raw('SUM("nominal") as total'))
            ->pluck('total', 'mitra_id');

        foreach ($penyesuaian as $mitraId => $total) {
            $rows[(int) $mitraId]['penyesuaian'] = (float) $total;
        }

        return $rows;
    }

    /**
     * Matriks tunggakan antar partner: berapa yang harus dibayar setiap member
     * ke member lain, berdasarkan split tagihan pembelian yang belum lunas.
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
        $mitras = $this->mitrasWithUsers();
        $ids = $mitras->pluck('id')->all();

        $matrix = $totalByDebtor = $totalByCreditor = [];
        foreach ($ids as $debtor) {
            $matrix[$debtor] = array_combine($ids, array_fill(0, count($ids), 0.0));
            $totalByDebtor[$debtor] = 0.0;
        }
        foreach ($ids as $creditor) {
            $totalByCreditor[$creditor] = 0.0;
        }

        // Satu query: pasangan (yang utang -> yang menalangi) dari split pembelian.
        $rows = DB::table('split_tagihans as st')
            ->join('pembelians as pb', 'pb.id', '=', 'st.pembelian_id')
            ->where('st.status', 'belum_lunas')
            ->when($preOrderId, fn ($q) => $q->where('pb.pre_order_id', $preOrderId))
            ->groupBy('st.mitra_id', 'pb.mitra_id')
            ->selectRaw('st."mitra_id" as debtor, pb."mitra_id" as creditor, SUM(st."bagian") as total')
            ->get();

        foreach ($rows as $row) {
            $debtor = (int) $row->debtor;
            $creditor = (int) $row->creditor;
            if ($debtor === $creditor) {
                continue;
            }
            $matrix[$debtor][$creditor] += (float) $row->total;
            $totalByDebtor[$debtor] += (float) $row->total;
            $totalByCreditor[$creditor] += (float) $row->total;
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
     * @return array<int, array{id:int,nama:string,kode:string,user_id:?int,email:?string,dibayar:float,bagian:float,dana_pribadi_masuk:float,dana_pribadi_keluar:float,transfer_keluar:float,transfer_masuk:float,saldo:float}>
     */
    public function balances(?int $preOrderId = null): array
    {
        $mitras = $this->mitrasWithUsers();

        $flows = $this->partnerFlowSums($preOrderId);

        // Transfer antar partner: satu query UNION untuk dua arah sekaligus.
        $transferPairs = DB::table('mitra_transfers')
            ->when($preOrderId, fn ($q) => $q->where('pre_order_id', $preOrderId))
            ->get(['dari_mitra_id', 'ke_mitra_id', 'nominal']);
        $transferOut = $transferIn = [];
        foreach ($transferPairs as $t) {
            $transferOut[(int) $t->dari_mitra_id] = ($transferOut[(int) $t->dari_mitra_id] ?? 0) + (float) $t->nominal;
            $transferIn[(int) $t->ke_mitra_id] = ($transferIn[(int) $t->ke_mitra_id] ?? 0) + (float) $t->nominal;
        }

        return $mitras->map(function (Mitra $mitra) use ($flows, $transferOut, $transferIn) {
            $flow = $flows[$mitra->id] ?? [];

            $dibayar = (float) ($flow['total_belanja'] ?? 0);
            $bagian = (float) ($flow['total_bagian_patungan'] ?? 0);
            $transferKeluar = (float) ($transferOut[$mitra->id] ?? 0);
            $transferMasuk = (float) ($transferIn[$mitra->id] ?? 0);
            $danaPribadiMasuk = (float) ($flow['dana_pribadi_masuk'] ?? 0);
            $danaPribadiKeluar = (float) ($flow['dana_pribadi_keluar'] ?? 0);
            $penyesuaian = (float) ($flow['penyesuaian'] ?? 0);

            return [
                'id' => $mitra->id,
                'nama' => $mitra->nama,
                'kode' => $mitra->kode,
                'user_id' => $mitra->user_id,
                'email' => $mitra->user?->email,
                'dibayar' => $dibayar,
                'bagian' => $bagian,
                'dana_pribadi_masuk' => $danaPribadiMasuk,
                'dana_pribadi_keluar' => $danaPribadiKeluar,
                'penyesuaian' => $penyesuaian,
                'transfer_keluar' => $transferKeluar,
                'transfer_masuk' => $transferMasuk,
                // saldo mensintesiskan SEMUA arus partner: belanja ditalangi,
                // bagian patungan, kas dana pribadi, penyesuaian manual,
                // dan transfer antar partner.
                'saldo' => $dibayar + $danaPribadiMasuk - $danaPribadiKeluar
                    - $bagian + $penyesuaian + $transferMasuk - $transferKeluar,
            ];
        })->all();
    }
}
