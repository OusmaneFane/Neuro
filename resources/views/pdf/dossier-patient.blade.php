<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Dossier patient — {{ $patient->full_name }}</title>
    <style>
        @page { margin: 16mm 14mm 18mm 14mm; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9.5pt;
            color: #0D1E35;
            line-height: 1.45;
        }

        .watermark {
            position: fixed;
            top: 42%;
            left: 8%;
            font-size: 28pt;
            font-weight: bold;
            color: rgba(13, 30, 53, 0.05);
            transform: rotate(-32deg);
            z-index: 0;
            white-space: nowrap;
        }

        .content { position: relative; z-index: 1; }

        .banner {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            background: #1a3352;
            color: #fff;
        }
        .banner td { padding: 12px 14px; vertical-align: middle; }
        .banner .brand { font-size: 16pt; font-weight: bold; letter-spacing: -0.02em; }
        .banner .brand span { color: #7CFF6A; }
        .banner .tag { font-size: 8pt; color: #94a3b8; margin-top: 2px; }
        .banner .meta { text-align: right; font-size: 8pt; color: #cbd5e1; }
        .banner .meta strong { color: #7CFF6A; display: block; font-size: 9pt; margin-bottom: 2px; }

        .badge-conf {
            display: inline-block;
            background: #7CFF6A;
            color: #061018;
            font-size: 7.5pt;
            font-weight: bold;
            padding: 3px 8px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        .summary {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            background: #f4f7fb;
            border: 1px solid #dbe4ef;
        }
        .summary td {
            width: 25%;
            padding: 8px 10px;
            border-right: 1px solid #dbe4ef;
            font-size: 8pt;
            color: #64748b;
        }
        .summary td:last-child { border-right: none; }
        .summary strong {
            display: block;
            color: #0D1E35;
            font-size: 10pt;
            margin-top: 2px;
        }

        .section { margin-bottom: 16px; page-break-inside: avoid; }
        .section-title {
            font-size: 10.5pt;
            font-weight: bold;
            color: #0D1E35;
            padding: 6px 0 6px 10px;
            margin: 0 0 8px 0;
            border-left: 4px solid #7CFF6A;
            background: linear-gradient(90deg, #eefcf1 0%, #ffffff 70%);
        }

        table.info { width: 100%; border-collapse: collapse; font-size: 9pt; }
        table.info td { padding: 5px 8px; border-bottom: 1px solid #e8eef5; vertical-align: top; }
        table.info td.lbl { width: 32%; color: #64748b; font-weight: 500; }
        table.info td.val { color: #0D1E35; }
        table.two-col { width: 100%; border-collapse: collapse; }
        table.two-col > tbody > tr > td { width: 50%; vertical-align: top; padding: 0 6px 0 0; }
        table.two-col > tbody > tr > td + td { padding: 0 0 0 6px; }

        .episode {
            border: 1px solid #dbe4ef;
            margin-bottom: 10px;
            background: #fff;
        }
        .episode-head {
            background: #1a3352;
            color: #fff;
            padding: 7px 10px;
            font-size: 9pt;
        }
        .episode-head .chip {
            display: inline-block;
            background: #7CFF6A;
            color: #061018;
            font-size: 7.5pt;
            font-weight: bold;
            padding: 2px 7px;
            margin-right: 8px;
        }
        .episode-body { padding: 8px 10px; }
        .field { margin: 0 0 5px 0; font-size: 9pt; }
        .field strong { color: #0D1E35; }
        .field .text { color: #334155; }

        .note {
            border-left: 3px solid #7CFF6A;
            background: #f8fafc;
            padding: 8px 10px;
            margin-bottom: 8px;
        }
        .note-meta { font-size: 7.5pt; color: #64748b; margin-top: 4px; }

        .pill-list { margin: 0; padding: 0; }
        .pill-list li {
            list-style: none;
            display: inline-block;
            background: #eefcf1;
            border: 1px solid #c6f0ce;
            color: #0D1E35;
            font-size: 8pt;
            padding: 2px 7px;
            margin: 0 4px 4px 0;
        }

        table.docs { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
        table.docs th {
            background: #1a3352;
            color: #fff;
            text-align: left;
            padding: 6px 8px;
            font-weight: bold;
        }
        table.docs td {
            padding: 5px 8px;
            border-bottom: 1px solid #e8eef5;
        }
        table.docs tr:nth-child(even) td { background: #f8fafc; }

        .empty { color: #94a3b8; font-style: italic; font-size: 9pt; }

        .footer {
            margin-top: 18px;
            padding-top: 8px;
            border-top: 2px solid #1a3352;
            font-size: 7.5pt;
            color: #64748b;
        }
        .footer .conf { color: #b45309; font-weight: bold; margin-bottom: 3px; }
        .footer .brand { color: #0D1E35; }
        .footer .brand span { color: #1a9e4a; }
    </style>
</head>
<body>
@php
    $cd = $patient->complementaryData;
    $formatItems = function ($items) {
        if (! is_array($items) || count($items) === 0) {
            return [];
        }
        return array_values(array_filter(array_map(function ($item) {
            if (is_string($item)) {
                return $item;
            }
            if (is_array($item)) {
                return $item['label_fr'] ?? $item['label'] ?? $item['name'] ?? $item['code'] ?? null;
            }
            return null;
        }, $items)));
    };
    $antecedents = is_array($cd?->antecedents ?? null) ? $cd->antecedents : [];
    $imagerie = $formatItems($cd?->imagerie ?? []);
    $biologie = $formatItems($cd?->biologie ?? []);
    $exploration = $formatItems($cd?->exploration ?? []);
    $emergencyName = trim(implode(' ', array_filter([
        $patient->emergency_contact_name,
        $patient->emergency_contact_first_name,
    ]))) ?: ($patient->emergency_contact ?? '—');
@endphp

<div class="watermark">CONFIDENTIEL — DoniSanté</div>

<div class="content">
    <table class="banner">
        <tr>
            <td style="width: 54px;">
                @if (!empty($logoPath) && file_exists($logoPath))
                    <img src="{{ $logoPath }}" width="42" height="42" alt="DoniSanté"/>
                @endif
            </td>
            <td>
                <div class="brand">Doni<span>Santé</span></div>
                <div class="tag">{{ $hospitalName }} — Dossier médical patient</div>
            </td>
            <td class="meta" style="width: 38%;">
                <strong>DOCUMENT CONFIDENTIEL</strong>
                Généré le {{ $generatedAt }}<br>
                Par {{ $generatedBy }}
            </td>
        </tr>
    </table>

    <table class="summary">
        <tr>
            <td>Patient<strong>{{ $patient->full_name }}</strong></td>
            <td>IUP<strong>{{ $patient->iup }}</strong></td>
            <td>Naissance<strong>{{ $patient->birth_date?->format('d/m/Y') ?? '—' }}@if($age !== null) ({{ $age }} ans)@endif</strong></td>
            <td>Statut<strong>{{ $patient->status === 'active' ? 'Actif' : ($patient->status ?? '—') }}</strong></td>
        </tr>
    </table>

    {{-- Identité --}}
    <div class="section">
        <div class="section-title">1. Identité &amp; contact</div>
        <table class="two-col">
            <tr>
                <td>
                    <table class="info">
                        <tr><td class="lbl">Nom</td><td class="val">{{ $patient->last_name }}</td></tr>
                        <tr><td class="lbl">Prénom</td><td class="val">{{ $patient->first_name }}</td></tr>
                        <tr><td class="lbl">Sexe</td><td class="val">{{ $patient->sex ?? '—' }}</td></tr>
                        <tr><td class="lbl">Latéralité</td><td class="val">{{ $patient->laterality ?? '—' }}</td></tr>
                        <tr><td class="lbl">Téléphone</td><td class="val">{{ $patient->phone ?? '—' }}</td></tr>
                        <tr><td class="lbl">Adresse</td><td class="val">{{ $patient->address ?? '—' }}</td></tr>
                    </table>
                </td>
                <td>
                    <table class="info">
                        <tr><td class="lbl">Niveau d'études</td><td class="val">{{ $patient->education_level ?? '—' }}</td></tr>
                        <tr><td class="lbl">Profession</td><td class="val">{{ $patient->profession ?? '—' }}</td></tr>
                        <tr><td class="lbl">Situation familiale</td><td class="val">{{ $patient->marital_status ?? '—' }}</td></tr>
                        <tr><td class="lbl">Médecin traitant</td><td class="val">{{ $patient->treating_doctor ?? '—' }}</td></tr>
                        <tr><td class="lbl">Contact d'urgence</td><td class="val">{{ $emergencyName }}</td></tr>
                        <tr><td class="lbl">Tél. urgence</td><td class="val">{{ $patient->emergency_contact_phone ?? '—' }}</td></tr>
                    </table>
                </td>
            </tr>
        </table>
        @if ($patient->usual_treatment)
            <p class="field" style="margin-top:8px;"><strong>Traitement habituel :</strong> <span class="text">{{ $patient->usual_treatment }}</span></p>
        @endif
    </div>

    {{-- Couvertures --}}
    @if(isset($coverages) && $coverages->count())
        <div class="section">
            <div class="section-title">2. Couverture / Tiers payant</div>
            <table class="docs">
                <thead>
                <tr>
                    <th>Organisme</th>
                    <th>N° adhérent</th>
                    <th>Taux</th>
                    <th>Période</th>
                    <th>Prioritaire</th>
                </tr>
                </thead>
                <tbody>
                @foreach($coverages as $cov)
                    <tr>
                        <td>{{ $cov->payer?->name ?? '—' }}</td>
                        <td>{{ $cov->member_number ?? '—' }}</td>
                        <td>{{ $cov->coverage_rate }}%</td>
                        <td>
                            {{ $cov->starts_on?->format('d/m/Y') ?? '—' }}
                            → {{ $cov->ends_on?->format('d/m/Y') ?? '—' }}
                        </td>
                        <td>{{ $cov->is_primary ? 'Oui' : 'Non' }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif

    {{-- Antécédents --}}
    <div class="section">
        <div class="section-title">{{ isset($coverages) && $coverages->count() ? '3' : '2' }}. Antécédents &amp; allergies</div>
        @php
            $antecBlocks = [
                'medicaux' => 'Médicaux',
                'chirurgicaux' => 'Chirurgicaux',
                'gyneco' => 'Gynéco-obstétriques',
                'familiaux' => 'Familiaux',
                'traitements_anterieurs' => 'Traitements antérieurs',
                'allergies' => 'Allergies',
            ];
            $hasAntec = false;
            foreach ($antecBlocks as $k => $_) {
                if (!empty($antecedents[$k])) { $hasAntec = true; break; }
            }
        @endphp
        @if ($hasAntec)
            @foreach($antecBlocks as $key => $label)
                @if (!empty($antecedents[$key]))
                    <p class="field"><strong>{{ $label }} :</strong></p>
                    <ul class="pill-list">
                        @foreach($antecedents[$key] as $item)
                            <li>{{ is_string($item) ? $item : ($item['label'] ?? '') }}</li>
                        @endforeach
                    </ul>
                @endif
            @endforeach
        @else
            <p class="empty">Aucun antécédent codifié renseigné.</p>
        @endif
    </div>

    {{-- Examens & traitements complémentaires --}}
    @if ($cd)
        <div class="section">
            <div class="section-title">Examens complémentaires &amp; traitements</div>
            <table class="two-col">
                <tr>
                    <td>
                        <p class="field"><strong>Imagerie</strong></p>
                        @if(count($imagerie))
                            <ul class="pill-list">@foreach($imagerie as $i)<li>{{ $i }}</li>@endforeach</ul>
                        @else
                            <p class="empty">—</p>
                        @endif
                        <p class="field" style="margin-top:8px;"><strong>Biologie</strong></p>
                        @if(count($biologie))
                            <ul class="pill-list">@foreach($biologie as $i)<li>{{ $i }}</li>@endforeach</ul>
                        @else
                            <p class="empty">—</p>
                        @endif
                    </td>
                    <td>
                        <p class="field"><strong>Exploration fonctionnelle</strong></p>
                        @if(count($exploration))
                            <ul class="pill-list">@foreach($exploration as $i)<li>{{ $i }}</li>@endforeach</ul>
                        @else
                            <p class="empty">—</p>
                        @endif
                        <p class="field" style="margin-top:8px;"><strong>Traitement d'entrée</strong></p>
                        <p class="text">{{ $cd->traitement_entree ?: '—' }}</p>
                        <p class="field" style="margin-top:6px;"><strong>Traitement de sortie</strong></p>
                        <p class="text">{{ $cd->traitement_sortie ?: '—' }}</p>
                    </td>
                </tr>
            </table>
            <table class="info" style="margin-top:8px;">
                <tr>
                    <td class="lbl">Évolution</td>
                    <td class="val">{{ $cd->evolution ?: '—' }}</td>
                </tr>
                @if ($cd->evolution_justification)
                    <tr>
                        <td class="lbl">Justification</td>
                        <td class="val">{{ $cd->evolution_justification }}</td>
                    </tr>
                @endif
                <tr>
                    <td class="lbl">Mode de sortie</td>
                    <td class="val">{{ $cd->mode_sortie ?: '—' }}</td>
                </tr>
            </table>
            @if (!empty(strip_tags((string) $cd->compte_rendu)))
                <p class="field" style="margin-top:10px;"><strong>Compte rendu médical</strong></p>
                <div class="text">{!! $cd->compte_rendu !!}</div>
            @endif
        </div>
    @endif

    {{-- Épisodes --}}
    <div class="section">
        <div class="section-title">Observations médicales / Épisodes</div>
        @forelse($episodes as $episode)
            <div class="episode">
                <div class="episode-head">
                    <span class="chip">{{ $episodeTypeLabels[$episode->type->value] ?? $episode->type->value }}</span>
                    {{ $episode->start_date?->format('d/m/Y') ?? '—' }}
                    @if ($episode->end_date)
                        → {{ $episode->end_date->format('d/m/Y') }}
                    @endif
                    @if ($episode->transport_mean)
                        · Transport : {{ $episode->transport_mean }}
                    @endif
                </div>
                <div class="episode-body">
                    @if ($episode->reason)
                        <p class="field"><strong>Motif :</strong> <span class="text">{{ $episode->reason }}</span></p>
                    @endif
                    @if ($episode->provenance)
                        <p class="field"><strong>Provenance :</strong> <span class="text">{{ $episode->provenance }}</span></p>
                    @endif
                    @if ($episode->therapeutic_pathway)
                        <p class="field"><strong>Parcours thérapeutique :</strong> <span class="text">{{ $episode->therapeutic_pathway }}</span></p>
                    @endif
                    @if ($episode->medical_history)
                        <p class="field"><strong>Histoire de la maladie :</strong> <span class="text">{{ $episode->medical_history }}</span></p>
                    @endif
                    @if ($episode->dietary_habits)
                        <p class="field"><strong>Habitudes alimentaires :</strong> <span class="text">{{ $episode->dietary_habits }}</span></p>
                    @endif
                    @if ($episode->clinical_exam)
                        <p class="field"><strong>Examen clinique :</strong> <span class="text">{{ $episode->clinical_exam }}</span></p>
                    @endif
                    @if ($episode->diagnosis)
                        <p class="field"><strong>Diagnostic :</strong> <span class="text">{{ $episode->diagnosis }}</span></p>
                    @endif
                    @if ($episode->complications)
                        <p class="field"><strong>Complications :</strong> <span class="text">{{ $episode->complications }}</span></p>
                    @endif
                    @if ($episode->discharge_date || $episode->discharge_reason)
                        <p class="field">
                            <strong>Sortie :</strong>
                            <span class="text">
                                {{ $episode->discharge_date?->format('d/m/Y') ?? '—' }}
                                @if ($episode->discharge_reason) — {{ $episode->discharge_reason }} @endif
                            </span>
                        </p>
                    @endif
                    @if ($episode->notes)
                        <p class="field"><strong>Notes :</strong> <span class="text">{{ $episode->notes }}</span></p>
                    @endif
                </div>
            </div>
        @empty
            <p class="empty">Aucune observation enregistrée.</p>
        @endforelse
    </div>

    {{-- Ordonnances --}}
    @if(isset($prescriptions) && $prescriptions->count())
        <div class="section">
            <div class="section-title">Ordonnances</div>
            @foreach($prescriptions as $rx)
                <div class="episode" style="margin-bottom:8px;">
                    <div class="episode-head">
                        Ordonnance #{{ $rx->id }}
                        · {{ $rx->status->value ?? $rx->status }}
                        · {{ $rx->prescribed_at?->format('d/m/Y H:i') ?? $rx->created_at?->format('d/m/Y') }}
                        @if($rx->prescriber) · Dr {{ $rx->prescriber->full_name }} @endif
                    </div>
                    <div class="episode-body">
                        @foreach($rx->items as $item)
                            <p class="field">
                                <strong>{{ $item->product?->name ?? 'Produit' }}</strong>
                                — qté {{ $item->quantity }}
                                @if($item->dosage_instructions) · {{ $item->dosage_instructions }} @endif
                                @if($item->duration_days) · {{ $item->duration_days }} j @endif
                                · délivré {{ $item->quantity_dispensed }}/{{ $item->quantity }}
                            </p>
                        @endforeach
                        @if($rx->notes)
                            <p class="field"><strong>Notes :</strong> <span class="text">{{ $rx->notes }}</span></p>
                        @endif
                    </div>
                </div>
            @endforeach
        </div>
    @endif

    {{-- Notes cliniques --}}
    <div class="section">
        <div class="section-title">Notes cliniques</div>
        @forelse($clinicalNotes as $note)
            <div class="note">
                <div>{{ $note->content }}</div>
                <div class="note-meta">
                    {{ $note->creator?->full_name ?? '—' }} — {{ $note->created_at?->format('d/m/Y H:i') }}
                </div>
            </div>
        @empty
            <p class="empty">Aucune note clinique.</p>
        @endforelse
    </div>

    {{-- Documents --}}
    <div class="section">
        <div class="section-title">Documents joints</div>
        @if($documents->count())
            <table class="docs">
                <thead>
                <tr>
                    <th>Fichier</th>
                    <th>Type</th>
                    <th>Taille</th>
                    <th>Date</th>
                </tr>
                </thead>
                <tbody>
                @foreach($documents as $doc)
                    <tr>
                        <td>{{ $doc->filename }}</td>
                        <td>{{ $documentTypeLabels[$doc->type->value] ?? $doc->type->value }}</td>
                        <td>{{ number_format($doc->size / 1024, 1) }} Ko</td>
                        <td>{{ $doc->created_at?->format('d/m/Y') }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        @else
            <p class="empty">Aucun document.</p>
        @endif
    </div>

    <div class="footer">
        <div class="conf">Document confidentiel — Usage professionnel uniquement. Ne pas diffuser hors cadre de soins.</div>
        <div>
            <span class="brand">Doni<span>Santé</span></span>
            · {{ $hospitalName }}
            · IUP {{ $patient->iup }}
            · Généré le {{ $generatedAt }} par {{ $generatedBy }}
        </div>
    </div>
</div>
</body>
</html>
