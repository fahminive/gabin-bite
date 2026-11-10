@extends('pdf.layout')

@section('title', 'Laporan Posisi Keuangan')
@section('report_title', 'Laporan Posisi Keuangan (Neraca)')
@section('report_period', 'Per Tanggal: ' . \Carbon\Carbon::parse($date)->format('d-m-Y'))

@section('content')
<table style="width: 100%; border-collapse: collapse;">
    <tr>
        <!-- KOLOM KIRI: ASET -->
        <td style="width: 48%; vertical-align: top; padding-right: 2%;">
            <table class="data-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th colspan="2">ASET (HARTA)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="bg-gray-50 font-bold">
                        <td colspan="2">Aset Lancar</td>
                    </tr>
                    <tr>
                        <td style="padding-left: 15px;">Kas dan Setara Kas</td>
                        <td class="text-right">Rp {{ number_format($assets['kas'] ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td style="padding-left: 15px;">Piutang Usaha</td>
                        <td class="text-right">Rp {{ number_format($assets['piutang'] ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td style="padding-left: 15px;">Persediaan Bahan Baku</td>
                        <td class="text-right">Rp {{ number_format($assets['persediaanBahan'] ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td style="padding-left: 15px;">Persediaan Produk Jadi</td>
                        <td class="text-right">Rp {{ number_format($assets['persediaanProduk'] ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    <tr class="font-bold">
                        <td style="padding-left: 10px;">Total Aset Lancar</td>
                        <td class="text-right">Rp {{ number_format($assets['totalAsetLancar'] ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    <tr class="bg-blue-50 font-bold" style="font-size: 9pt;">
                        <td>TOTAL ASET</td>
                        <td class="text-right" style="border-top: 1.5px solid #2d3748; border-bottom: 1.5px solid #2d3748;">
                            Rp {{ number_format($assets['totalAset'] ?? 0, 0, ',', '.') }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </td>

        <!-- KOLOM KANAN: KEWAJIBAN & EKUITAS -->
        <td style="width: 48%; vertical-align: top; padding-left: 2%;">
            <table class="data-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th colspan="2">KEWAJIBAN & EKUITAS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="bg-gray-50 font-bold">
                        <td colspan="2">Kewajiban (Hutang)</td>
                    </tr>
                    <tr>
                        <td style="padding-left: 15px;">Hutang Dagang</td>
                        <td class="text-right">Rp {{ number_format($liabilities['hutang'] ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td style="padding-left: 15px;">Hutang Pajak PPh Final</td>
                        <td class="text-right">Rp {{ number_format($liabilities['hutangPajak'] ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    <tr class="font-bold">
                        <td style="padding-left: 10px;">Total Kewajiban</td>
                        <td class="text-right">Rp {{ number_format($liabilities['totalHutang'] ?? 0, 0, ',', '.') }}</td>
                    </tr>

                    <tr class="bg-gray-50 font-bold">
                        <td colspan="2">Ekuitas (Modal)</td>
                    </tr>
                    <tr>
                        <td style="padding-left: 15px;">Modal Disetor</td>
                        <td class="text-right">Rp {{ number_format($equity['modal'] ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    <tr>
                        <td style="padding-left: 15px;">Laba Ditahan (Akumulatif)</td>
                        <td class="text-right">Rp {{ number_format($equity['labaDitahan'] ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    <tr class="font-bold">
                        <td style="padding-left: 10px;">Total Ekuitas</td>
                        <td class="text-right">Rp {{ number_format($equity['totalEkuitas'] ?? 0, 0, ',', '.') }}</td>
                    </tr>
                    
                    <tr class="bg-blue-50 font-bold" style="font-size: 9pt;">
                        <td>TOTAL KEWAJIBAN & EKUITAS</td>
                        <td class="text-right" style="border-top: 1.5px solid #2d3748; border-bottom: 1.5px solid #2d3748;">
                            Rp {{ number_format($totalKewajibanDanEkuitas, 0, ',', '.') }}
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- STATUS SEIMBANG (BALANCED) -->
            <div style="margin-top: 15px; padding: 6px 10px; border-radius: 4px; font-size: 8pt; text-align: center;" 
                 class="{{ $isBalanced ? 'badge-success' : 'badge-danger' }}">
                <strong>Status Neraca:</strong> {{ $isBalanced ? 'SEIMBANG (BALANCED)' : 'TIDAK SEIMBANG' }}
            </div>
        </td>
    </tr>
</table>

<table style="width: 100%; border-collapse: collapse; margin-top: 35px;">
    <tr>
        <td style="width: 50%; vertical-align: top;">
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
