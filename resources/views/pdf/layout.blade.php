<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>@yield('title')</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10pt;
            color: #000000;
            line-height: 1.4;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .header-text {
            text-align: center;
            vertical-align: middle;
        }
        .company-name {
            font-size: 16pt;
            font-weight: bold;
            color: #000000;
            text-transform: uppercase;
            margin: 0;
            letter-spacing: 1px;
        }
        .company-details {
            font-size: 8pt;
            color: #000000;
            margin-top: 3px;
        }
        .header-line {
            border-top: 2px solid #000000;
            border-bottom: 1px solid #000000;
            height: 3px;
            margin-bottom: 15px;
        }
        .report-title {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            color: #000000;
            margin-bottom: 3px;
            text-transform: uppercase;
        }
        .report-period {
            text-align: center;
            font-size: 9pt;
            color: #000000;
            margin-bottom: 15px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .data-table th {
            background-color: #ffffff;
            color: #000000;
            font-size: 8.5pt;
            font-weight: bold;
            padding: 6px 8px;
            text-align: left;
            border: 1px solid #000000;
            border-bottom: 2px solid #000000;
        }
        .data-table td {
            font-size: 8.5pt;
            padding: 6px 8px;
            border: 1px solid #000000;
        }
        .data-table tr:nth-child(even) td {
            background-color: #ffffff;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .font-bold {
            font-weight: bold;
        }
        /* Overriding colors to black and white */
        .bg-gray-50, .bg-gray-100, .bg-blue-50, .bg-emerald-50, .bg-red-50 {
            background-color: #ffffff !important;
        }
        .text-danger, .text-success, .text-warning {
            color: #000000 !important;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 20px;
            text-align: center;
            font-size: 7.5pt;
            color: #000000;
            border-top: 1px solid #000000;
            padding-top: 4px;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            font-size: 7.5pt;
            font-weight: bold;
            border-radius: 4px;
            text-align: center;
            border: 1px solid #000000;
            color: #000000;
        }
        .badge-success, .badge-warning, .badge-danger, .badge-secondary {
            background-color: #ffffff;
            color: #000000;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td class="header-text">
                <div class="company-name">GABINBITE.PWT</div>
                <div class="company-details">
                    Gabin Es Krim &middot; Jl. Pemuda No. 123, Purwokerto, Banyumas, Jawa Tengah 53124<br>
                    Email: halo@gabinbite.pwt | Telp: 0812-3456-7890
                </div>
            </td>
        </tr>
    </table>
    <div class="header-line"></div>

    <div class="report-title">@yield('report_title')</div>
    <div class="report-period">@yield('report_period')</div>

    @yield('content')

    <div class="footer">
        Dicetak otomatis oleh gabinbite.pwt pada {{ date('d-m-Y H:i:s') }} &middot; gabin renyah, buku rapi
    </div>
</body>
</html>
