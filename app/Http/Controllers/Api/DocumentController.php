<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Document\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function stats(): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', Document::class);

        $totalCount = Document::count();
        $totalSize = Document::sum('size');
        $thisMonth = Document::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $byType = Document::selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->map(fn ($v) => (int) $v)
            ->all();

        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $months->push(now()->subMonths($i)->format('Y-m'));
        }

        $byMonth = Document::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, count(*) as count")
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->pluck('count', 'month')
            ->all();

        $trend = $months->map(fn ($m) => $byMonth[$m] ?? 0)->values()->all();
        $trendLabels = $months->map(fn ($m) => \Carbon\Carbon::parse($m . '-01')->locale('fr')->isoFormat('MMM YYYY'))->values()->all();

        return response()->json([
            'total_count' => $totalCount,
            'total_size' => $totalSize,
            'this_month' => $thisMonth,
            'by_type' => [
                'LAB' => $byType['LAB'] ?? 0,
                'IMAGING' => $byType['IMAGING'] ?? 0,
                'PRESCRIPTION' => $byType['PRESCRIPTION'] ?? 0,
                'DISCHARGE' => $byType['DISCHARGE'] ?? 0,
                'ADMIN' => $byType['ADMIN'] ?? 0,
                'OTHER' => $byType['OTHER'] ?? 0,
            ],
            'trend_labels' => $trendLabels,
            'trend' => $trend,
        ]);
    }

    public function recent(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Document::class);

        $documents = Document::query()
            ->with(['patient:id,iup,first_name,last_name'])
            ->when($request->input('type'), fn ($q, $type) => $q->where('type', $type))
            ->orderByDesc('created_at')
            ->paginate(min((int) $request->input('limit', 20), 100));

        return DocumentResource::collection($documents);
    }

    public function index(Request $request, Patient $patient): AnonymousResourceCollection
    {
        $this->authorize('view', $patient);

        $documents = $patient->documents()
            ->with('creator:id,full_name')
            ->when($request->input('episode_id'), fn ($q, $id) => $q->where('episode_id', $id))
            ->paginate($request->input('limit', 15));

        return DocumentResource::collection($documents);
    }

    public function store(StoreDocumentRequest $request, Patient $patient): JsonResponse
    {
        $file = $request->file('file');
        $safeName = Str::uuid().'_'.Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs("documents/{$patient->id}", $safeName, 'public');

        $document = $patient->documents()->create([
            'type' => $request->input('type'),
            'episode_id' => $request->input('episode_id'),
            'filename' => $file->getClientOriginalName(),
            'path' => $path,
            'mime' => $file->getMimeType(),
            'size' => $file->getSize(),
            'created_by' => auth()->id(),
        ]);

        return response()->json(new DocumentResource($document->load('creator:id,full_name')), 201);
    }

    public function download(Patient $patient, Document $document): StreamedResponse|Response
    {
        if ($document->patient_id !== $patient->id) {
            abort(404);
        }
        $this->authorize('view', $document);

        return $this->streamDocument($document);
    }

    public function downloadForPatient(Document $document): StreamedResponse|Response
    {
        $patient = auth()->user()?->patient;
        if (! $patient || $document->patient_id !== $patient->id) {
            abort(404);
        }
        $this->authorize('view', $document);

        return $this->streamDocument($document);
    }

    private function streamDocument(Document $document): StreamedResponse|Response
    {
        $path = Storage::disk('public')->path($document->path);
        if (! file_exists($path)) {
            abort(404);
        }

        $disposition = request()->query('disposition', 'inline') === 'attachment' ? 'attachment' : 'inline';

        return response()->streamDownload(
            fn () => readfile($path),
            $document->filename,
            [
                'Content-Type' => $document->mime ?? 'application/octet-stream',
            ],
            $disposition
        );
    }
}
