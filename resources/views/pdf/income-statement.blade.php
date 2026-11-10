@extends('pdf.layout')

@section('title', 'Laporan Laba Rugi')
@section('report_title', 'Laporan Laba Rugi')
@section('report_period', 'Periode: ' . \Carbon\Carbon::parse($startDate)->format('d-m-Y') . ' s/d ' . \Carbon\Carbon::parse($endDate)->format('d-m-Y'))

@section('content')
<table class="data-table">
    <thead>
        <tr>
            <th>Deskripsi Akun</th>
            <th class="text-right" style="width: 200px;">Nominal (Rupiah)</th>
        </tr>
    </thead>
    <tbody>
        <!-- PENDAPATAN -->
        <tr class="bg-gray-50 font-bold">
            <td colspan="2">PENDAPATAN</td>
        </tr>
        <tr>
            <td style="padding-left: 20px;">Pendapatan Penjualan Produk</td>
            <td class="text-right">Rp {{ number_format($pendapatan, 0, ',', '.') }}</td>
        </tr>
        <tr class="font-bold">
            <td style="padding-left: 10px;">Total Pendapatan</td>
            <td class="text-right">Rp {{ number_format($pendapatan, 0, ',', '.') }}</td>
        </tr>

        <!-- HPP -->
        <tr class="bg-gray-50 font-bold">
            <td colspan="2">HARGA POKOK PENJUALAN (HPP)</td>
        </tr>
        <tr>
            <td style="padding-left: 20px;">Beban HPP Produk Terjual</td>
            <td class="text-right text-danger">({{ number_format($hpp, 0, ',', '.') }})</td>
        </tr>
        <tr class="font-bold">
            <td style="padding-left: 10px;">Total Harga Pokok Penjualan</td>
            <td class="text-right text-danger">({{ number_format($hpp, 0, ',', '.') }})</td>
        </tr>

        <!-- LABA KOTOR -->
        <tr class="bg-blue-50 font-bold" style="font-size: 9.5pt;">
            <td>LABA KOTOR</td>
            <td class="text-right">Rp {{ number_format($labaKotor, 0, ',', '.') }}</td>
        </tr>

        <!-- BEBAN OPERASIONAL -->
        <tr class="bg-gray-50 font-bold">
            <td colspan="2">BEBAN OPERASIONAL</td>
        </tr>
        <tr>
            <td style="padding-left: 20px;">Kerugian Koreksi Stok</td>
            <td class="text-right text-danger">({{ number_format($operasionalDetail['koreksiStokLoss'], 0, ',', '.') }})</td>
        </tr>
        <tr>
            <td style="padding-left: 20px;">Keuntungan Koreksi Stok</td>
            <td class="text-right text-success">{{ number_format($operasionalDetail['koreksiStokGain'], 0, ',', '.') }}</td>
        </tr>
        <tr class="font-bold">
            <td style="padding-left: 10px;">Total Beban Operasional</td>
            <td class="text-right text-danger">({{ number_format($operasional, 0, ',', '.') }})</td>
        </tr>

        <!-- LABA BERSIH SEBELUM PAJAK -->
        <tr class="{{ $labaBersihSebelumPajak >= 0 ? 'bg-emerald-50 text-success' : 'bg-red-50 text-danger' }} font-bold" style="font-size: 10.5pt;">
            <td>LABA BERSIH OPERASIONAL</td>
            <td class="text-right" style="border-top: 2px solid #2d3748;">
                Rp {{ number_format($labaBersihSebelumPajak, 0, ',', '.') }}
            </td>
        </tr>

        <!-- BEBAN PAJAK -->
        <tr class="bg-gray-50 font-bold">
            <td colspan="2">KEWAJIBAN PAJAK</td>
        </tr>
        <tr>
            <td style="padding-left: 20px;">Beban Pajak PPh Final UMKM (0.5% Omzet)</td>
            <td class="text-right text-danger">({{ number_format($bebanPajak, 0, ',', '.') }})</td>
        </tr>

        <!-- LABA BERSIH SETELAH PAJAK -->
        <tr class="{{ $labaBersih >= 0 ? 'bg-emerald-50 text-success' : 'bg-red-50 text-danger' }} font-bold" style="font-size: 11pt;">
            <td>LABA BERSIH SETELAH PAJAK</td>
            <td class="text-right" style="border-top: 2px solid #2d3748; border-bottom: 2px double #2d3748;">
                Rp {{ number_format($labaBersih, 0, ',', '.') }}
            </td>
        </tr>
    </tbody>
</table>

<table style="width: 100%; border-collapse: collapse; margin-top: 25px;">
    <tr>
        <td style="width: 50%; vertical-align: top;">
            <div style="font-size: 8.5pt; color: #4a5568;">
                <strong>Analisis Kinerja Keuangan:</strong><br>
                - Margin Laba Kotor: {{ $pendapatan > 0 ? number_format(($labaKotor / $pendapatan) * 100, 1, ',', '.') : '0' }}%<br>
                - Margin Laba Bersih: {{ $pendapatan > 0 ? number_format(($labaBersih / $pendapatan) * 100, 1, ',', '.') : '0' }}%
            </div>
        </td>
        <td style="width: 50%; text-align: right; vertical-align: top;">
            <div style="font-size: 9pt; display: inline-block; text-align: center; margin-right: 20px;">
                <p>Mengetahui,</p>
                <br><br><br>
                <p style="text-decoration: underline; font-weight: bold; margin-bottom: 0;">Bagian Keuangan</p>
                <p style="font-size: 8pt; color: #718096; margin-top: 0;">gabinbite.pwt</p>
            </div>
        </td>
    </tr>
</table>
@endsection
