<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\CostCenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CostCenterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = CostCenter::query()->with('parent:id,code,name')->orderBy('code');
        if ($request->boolean('active_only')) {
            $q->where('is_active', true);
        }

        return response()->json(['data' => $q->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:30|unique:cost_centers,code',
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:cost_centers,id',
            'is_active' => 'boolean',
        ]);

        return response()->json(['data' => CostCenter::create($data)], 201);
    }

    public function update(Request $request, CostCenter $costCenter): JsonResponse
    {
        $data = $request->validate([
            'code' => 'sometimes|string|max:30|unique:cost_centers,code,'.$costCenter->id,
            'name' => 'sometimes|string|max:255',
            'parent_id' => 'nullable|exists:cost_centers,id',
            'is_active' => 'boolean',
        ]);
        $costCenter->update($data);

        return response()->json(['data' => $costCenter->fresh('parent')]);
    }
}
