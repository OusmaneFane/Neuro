<?php

namespace App\Http\Controllers\Api;

use App\Enums\DocumentType;
use App\Enums\EpisodeType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\StorePatientRequest;
use App\Http\Requests\Patient\UpdatePatientRequest;
use App\Http\Resources\EpisodeResource;
use App\Http\Resources\PatientResource;
use App\Models\DossierDownloadLog;
use App\Models\Patient;
use App\Models\PatientComplementaryData;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;

class PatientController extends Controller
{
    public function stats(): JsonResponse
    {
        $this->authorize('viewAny', Patient::class);

        $total = Patient::count();
        $active = Patient::where('status', 'active')->count();
        $thisMonth = Patient::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $evolutionCounts = PatientComplementaryData::select('evolution', DB::raw('count(*) as count'))
            ->whereNotNull('evolution')
            ->where('evolution', '!=', '')
            ->groupBy('evolution')
            ->pluck('count', 'evolution')
            ->all();

        $modeSortieCounts = PatientComplementaryData::select('mode_sortie', DB::raw('count(*) as count'))
            ->whereNotNull('mode_sortie')
            ->where('mode_sortie', '!=', '')
            ->groupBy('mode_sortie')
            ->pluck('count', 'mode_sortie')
            ->all();

        return response()->json([
            'total' => $total,
            'active' => $active,
            'this_month' => $thisMonth,
            'evolution' => [
                'Favorable' => (int) ($evolutionCounts['Favorable'] ?? 0),
                'Chronique' => (int) ($evolutionCounts['Chronique'] ?? 0),
                'Décès' => (int) ($evolutionCounts['Décès'] ?? 0),
            ],
            'mode_sortie' => $modeSortieCounts,
        ]);
    }

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $this->authorize('viewAny', Patient::class);

        $query = Patient::query();

        if ($search = $request->input('query')) {
            $term = '%'.$search.'%';
            $query->where(function ($q) use ($term) {
                $q->where('iup', 'like', $term)
                    ->orWhere('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term);
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $perPage = min((int) $request->input('limit', 15), 100);
        $patients = $query->with('complementaryData')->orderBy('last_name')->paginate($perPage);

        return PatientResource::collection($patients);
    }

    public function store(StorePatientRequest $request): JsonResponse
    {
        $data = array_merge($request->validated(), [
            'iup' => Patient::generateIup(),
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);
        $patient = Patient::create($data);

        return response()->json(new PatientResource($patient->fresh()->load(['creator:id,full_name', 'updater:id,full_name'])), 201);
    }

    public function show(Patient $patient): JsonResponse
    {
        $this->authorize('view', $patient);

        return response()->json(new PatientResource($patient->load(['creator:id,full_name', 'updater:id,full_name'])));
    }

    public function update(UpdatePatientRequest $request, Patient $patient): JsonResponse
    {
        $patient->update(array_merge($request->validated(), [
            'updated_by' => auth()->id(),
        ]));

        return response()->json(new PatientResource($patient->fresh()->load(['creator:id,full_name', 'updater:id,full_name'])));
    }

    public function episodes(Request $request, Patient $patient): AnonymousResourceCollection
    {
        $this->authorize('view', $patient);

        $episodes = $patient->episodes()->paginate($request->input('limit', 15));

        return EpisodeResource::collection($episodes);
    }

    public function exportDossierPdf(Request $request, Patient $patient): Response
    {
        $this->authorize('view', $patient);

        DossierDownloadLog::create([
            'patient_id' => $patient->id,
            'user_id' => auth()->id(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $patient->load([
            'complementaryData',
            'coverages.payer',
            'episodes' => fn ($q) => $q->orderByDesc('start_date'),
            'clinicalNotes' => fn ($q) => $q->with('creator:id,full_name')->orderByDesc('created_at'),
            'documents',
            'prescriptions' => fn ($q) => $q->with(['items.product', 'prescriber:id,full_name'])->orderByDesc('created_at'),
        ]);

        $episodeTypeLabels = [
            EpisodeType::CONSULTATION->value => 'Consultation',
            EpisodeType::HOSPITALIZATION->value => 'Hospitalisation',
            EpisodeType::EMERGENCY->value => 'Urgence',
        ];
        $documentTypeLabels = [
            DocumentType::LAB->value => 'Biologie',
            DocumentType::IMAGING->value => 'Imagerie',
            DocumentType::PRESCRIPTION->value => 'Ordonnance',
            DocumentType::DISCHARGE->value => 'Sortie',
            DocumentType::ADMIN->value => 'Administratif',
            DocumentType::OTHER->value => 'Autre',
        ];

        $age = null;
        if ($patient->birth_date) {
            $age = $patient->birth_date->age;
        }

        $pdf = Pdf::loadView('pdf.dossier-patient', [
            'patient' => $patient,
            'age' => $age,
            'episodes' => $patient->episodes,
            'clinicalNotes' => $patient->clinicalNotes,
            'documents' => $patient->documents,
            'coverages' => $patient->coverages,
            'prescriptions' => $patient->prescriptions,
            'episodeTypeLabels' => $episodeTypeLabels,
            'documentTypeLabels' => $documentTypeLabels,
            'hospitalName' => auth()->user()?->hospital?->name ?? 'Établissement de santé',
            'generatedAt' => now()->locale('fr_FR')->isoFormat('dddd D MMMM Y à H:mm'),
            'generatedBy' => auth()->user()->full_name,
            'logoPath' => public_path('DoniSante-icon-clear.png'),
        ])->setPaper('a4', 'portrait');

        $filename = sprintf('dossier-patient-%s-%s.pdf', $patient->iup, now()->format('Y-m-d-His'));

        return $pdf->download($filename);
    }
}
