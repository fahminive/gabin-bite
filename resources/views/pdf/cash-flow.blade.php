@extends('pdf.layout')

@section('title', 'Laporan Arus Kas')
@section('report_title', 'Laporan Arus Kas')
@section('report_period', 'Periode: ' . \Carbon\Carbon::parse($startDate)->format('d-m-Y') . ' s/d ' . \Carbon\Carbon::parse($endDate)->format('d-m-Y'))

@section('content')
<table class="data-table">
    <thead>
        <tr>
            <th>Deskripsi / Kategori Arus Kas</th>
            <th class="text-right" style="width: 200px;">Nominal (Rupiah)</th>
        </tr>
    </thead>
    <tbody>
        <!-- SALDO AWAL -->
        <tr class="bg-gray-100 font-bold">
            <td>SALDO AWAL KAS</td>
            <td class="text-right">Rp {{ number_format($saldoAwal, 0, ',', '.') }}</td>
        </tr>

        <!-- INFLOWS -->
        <tr class="bg-blue-50 font-bold">
            <td colspan="2">ARUS KAS MASUK (INFLOW)</td>
        </tr>
        <tr>
            <td style="padding-left: 25px;">Penerimaan dari Penjualan</td>
            <td class="text-right">Rp {{ number_format($inflows['penjualan'] ?? 0, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td style="padding-left: 25px;">Penerimaan Piutang</td>
            <td class="text-right">Rp {{ number_format($inflows['piutang'] ?? 0, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td style="padding-left: 25px;">Penerimaan Modal</td>
            <td class="text-right">Rp {{ number_format($inflows['modal'] ?? 0, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td style="padding-left: 25px;">Penyesuaian Kas - Uang Usaha</td>
            <td class="text-right">Rp {{ number_format($inflows['cashUsaha'] ?? 0, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td style="padding-left: 25px;">Penyesuaian Kas - Uang Member</td>
            <td class="text-right">Rp {{ number_format($inflows['cashPribadi'] ?? 0, 0, ',', '.') }}</td>
        </tr>
        @if (($inflows['cashLainnya'] ?? 0) != 0)
        <tr>
            <td style="padding-left: 25px;">Penyesuaian Kas - Lainnya</td>
            <td class="text-right">Rp {{ number_format($inflows['cashLainnya'], 0, ',', '.') }}</td>
        </tr>
        @endif
        <tr class="font-bold bg-gray-50">
            <td style="padding-left: 15px;">Total Arus Kas Masuk</td>
            <td class="text-right text-success">Rp {{ number_format($totalInflow, 0, ',', '.') }}</td>
        </tr>

        <!-- OUTFLOWS -->
        <tr class="bg-red-50 font-bold">
            <td colspan="2">ARUS KAS KELUAR (OUTFLOW)</td>
        </tr>
        <tr>
            <td style="padding-left: 25px;">Pengeluaran Pembelian Bahan Baku</td>
            <td class="text-right">Rp {{ number_format($outflows['pembelian'] ?? 0, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td style="padding-left: 25px;">Pembayaran Hutang Usaha</td>
            <td class="text-right">Rp {{ number_format($outflows['hutang'] ?? 0, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td style="padding-left: 25px;">Penyesuaian Kas - Uang Usaha</td>
            <td class="text-right">Rp {{ number_format($outflows['cashUsaha'] ?? 0, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td style="padding-left: 25px;">Penyesuaian Kas - Uang Member</td>
            <td class="text-right">Rp {{ number_format($outflows['cashPribadi'] ?? 0, 0, ',', '.') }}</td>
        </tr>
        @if (($outflows['cashLainnya'] ?? 0) != 0)
        <tr>
            <td style="padding-left: 25px;">Penyesuaian Kas - Lainnya</td>
            <td class="text-right">Rp {{ number_format($outflows['cashLainnya'], 0, ',', '.') }}</td>
        </tr>
        @endif
        <tr class="font-bold bg-gray-50">
            <td style="padding-left: 15px;">Total Arus Kas Keluar</td>
            <td class="text-right text-danger">Rp {{ number_format($totalOutflow, 0, ',', '.') }}</td>
        </tr>

        <!-- SALDO AKHIR -->
        <tr class="bg-gray-100 font-bold" style="font-size: 10pt;">
            <td>SALDO AKHIR KAS</td>
            <td class="text-right" style="border-top: 2px solid #2d3748; border-bottom: 2px double #2d3748;">
                Rp {{ number_format($saldoAkhir, 0, ',', '.') }}
            </td>
        </tr>
    </tbody>
</table>
@endsection
