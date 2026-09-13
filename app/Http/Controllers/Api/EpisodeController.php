<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Episode\StoreEpisodeRequest;
use App\Http\Resources\EpisodeResource;
use App\Models\Episode;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EpisodeController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Episode::query()
            ->with('patient:id,iup,first_name,last_name,birth_date')
            ->orderByDesc('start_date');

        if ($search = $request->input('query')) {
            $term = '%' . $search . '%';
            $query->whereHas('patient', function ($q) use ($term) {
                $q->where('iup', 'like', $term)
                    ->orWhere('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term);
            });
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($request->has('from_date')) {
            $query->whereDate('start_date', '>=', $request->input('from_date'));
        }

        if ($request->has('to_date')) {
            $query->whereDate('start_date', '<=', $request->input('to_date'));
        }

        $perPage = min((int) $request->input('limit', 20), 100);
        $episodes = $query->paginate($perPage);

        return EpisodeResource::collection($episodes);
    }

    public function store(StoreEpisodeRequest $request, Patient $patient): JsonResponse
    {
        $this->authorize('view', $patient);

        $data = array_merge($request->validated(), [
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);
        $episode = $patient->episodes()->create($data);

        return response()->json(new EpisodeResource($episode->load(['patient:id,iup,first_name,last_name,birth_date', 'creator:id,full_name', 'updater:id,full_name'])), 201);
    }
}
