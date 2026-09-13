<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $invoice->number }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1e293b; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #f1f5f9; }
        .right { text-align: right; }
        .muted { color: #64748b; }
        .totals { margin-top: 16px; width: 45%; margin-left: auto; }
    </style>
</head>
<body>
    <h1>DoniSanté — Facture {{ $invoice->number }}</h1>
    <p class="muted">Émise le {{ optional($invoice->issued_at)->format('d/m/Y H:i') ?? '—' }} · Devise {{ $invoice->currency_code }}</p>
    <p>
        <strong>Patient :</strong> {{ $invoice->patient->full_name }} ({{ $invoice->patient->iup }})<br>
        @if($invoice->episode)
            <strong>Épisode :</strong> {{ $invoice->episode->type }} — {{ optional($invoice->episode->start_date)->format('d/m/Y') }}
        @endif
    </p>
    <table>
        <thead>
            <tr>
                <th>Libellé</th>
                <th class="right">Qté</th>
                <th class="right">P.U.</th>
                <th class="right">Remise</th>
                <th class="right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->lines as $line)
                <tr>
                    <td>{{ $line->label }}</td>
                    <td class="right">{{ $line->quantity }}</td>
                    <td class="right">{{ number_format($line->unit_price, 0, ',', ' ') }}</td>
                    <td class="right">{{ number_format($line->discount, 0, ',', ' ') }}</td>
                    <td class="right">{{ number_format($line->line_total, 0, ',', ' ') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <table class="totals">
        <tr><td>Total</td><td class="right">{{ number_format($invoice->total, 0, ',', ' ') }} F CFA</td></tr>
        <tr><td>Part tiers</td><td class="right">{{ number_format($invoice->third_party_share, 0, ',', ' ') }} F CFA</td></tr>
        <tr><td>Part patient</td><td class="right">{{ number_format($invoice->patient_share, 0, ',', ' ') }} F CFA</td></tr>
        <tr><td>Payé</td><td class="right">{{ number_format($invoice->amount_paid, 0, ',', ' ') }} F CFA</td></tr>
        <tr><td><strong>Reste dû</strong></td><td class="right"><strong>{{ number_format($invoice->balance_due, 0, ',', ' ') }} F CFA</strong></td></tr>
    </table>
</body>
</html>
