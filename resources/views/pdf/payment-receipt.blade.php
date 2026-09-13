<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Reçu #{{ $payment->id }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1e293b; }
        h1 { font-size: 18px; }
        .box { border: 1px solid #cbd5e1; padding: 16px; margin-top: 12px; }
    </style>
</head>
<body>
    <h1>DoniSanté — Reçu de paiement</h1>
    <div class="box">
        <p><strong>N° reçu :</strong> REC-{{ $payment->id }}</p>
        <p><strong>Date :</strong> {{ $payment->paid_at->format('d/m/Y H:i') }}</p>
        <p><strong>Facture :</strong> {{ $payment->invoice->number }}</p>
        <p><strong>Patient :</strong> {{ $payment->invoice->patient->full_name }}</p>
        <p><strong>Mode :</strong> {{ $payment->mode->value }}</p>
        @if($payment->reference)<p><strong>Référence :</strong> {{ $payment->reference }}</p>@endif
        <p><strong>Montant :</strong> {{ number_format($payment->amount, 0, ',', ' ') }} F CFA</p>
        <p><strong>Encaissé par :</strong> {{ $payment->creator?->full_name ?? '—' }}</p>
    </div>
</body>
</html>
