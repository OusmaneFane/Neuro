<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\Payer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Payer::query()->orderBy('name');
        if ($request->boolean('active_only')) {
            $q->where('is_active', true);
        }
        if ($search = $request->input('query')) {
            $term = '%'.$search.'%';
            $q->where(fn ($b) => $b->where('name', 'like', $term)->orWhere('code', 'like', $term));
        }

        return response()->json(['data' => $q->paginate(min((int) $request->input('limit', 50), 100))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:30|unique:payers,code',
            'name' => 'required|string|max:255',
            'type' => 'required|in:INSURANCE,EMPLOYER,NGO,STATE,OTHER',
            'contact_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'default_coverage_rate' => 'nullable|integer|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $payer = Payer::create($data);

        return response()->json(['data' => $payer], 201);
    }

    public function update(Request $request, Payer $payer): JsonResponse
    {
        $data = $request->validate([
            'code' => 'sometimes|string|max:30|unique:payers,code,'.$payer->id,
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:INSURANCE,EMPLOYER,NGO,STATE,OTHER',
            'contact_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'default_coverage_rate' => 'nullable|integer|min:0|max:100',
            'is_active' => 'boolean',
        ]);
        $payer->update($data);

        return response()->json(['data' => $payer->fresh()]);
    }
}
