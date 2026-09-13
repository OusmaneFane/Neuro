<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Ordonnance #{{ $prescription->id }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
        th { background: #ecfeff; }
    </style>
</head>
<body>
    <h1>Ordonnance #{{ $prescription->id }}</h1>
    <p><strong>Patient :</strong> {{ $prescription->patient->full_name }} ({{ $prescription->patient->iup }})</p>
    <p><strong>Prescripteur :</strong> {{ $prescription->prescriber?->full_name ?? '—' }}</p>
    <p><strong>Date :</strong> {{ optional($prescription->prescribed_at)->format('d/m/Y H:i') ?? '—' }}</p>
    <table>
        <thead>
            <tr><th>Médicament</th><th>Qté</th><th>Posologie</th><th>Délivré</th></tr>
        </thead>
        <tbody>
            @foreach($prescription->items as $item)
                <tr>
                    <td>{{ $item->product->name }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ $item->dosage_instructions }}</td>
                    <td>{{ $item->quantity_dispensed }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
