<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $order->number }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
        th { background: #f1f5f9; }
    </style>
</head>
<body>
    <h1>Bon de commande {{ $order->number }}</h1>
    <p><strong>Fournisseur :</strong> {{ $order->supplier->name }}</p>
    <p><strong>Statut :</strong> {{ $order->status->value }} · Attendu : {{ optional($order->expected_at)->format('d/m/Y') ?? '—' }}</p>
    <table>
        <thead>
            <tr><th>Produit</th><th>Qté</th><th>Coût unitaire</th></tr>
        </thead>
        <tbody>
            @foreach($order->lines as $line)
                <tr>
                    <td>{{ $line->product->name }} ({{ $line->product->code }})</td>
                    <td>{{ $line->quantity_ordered }}</td>
                    <td>{{ number_format($line->unit_cost, 0, ',', ' ') }} F CFA</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
