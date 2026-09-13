<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\TariffItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TariffItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = TariffItem::query()->with('costCenter:id,code,name')->orderBy('label');
        if ($request->boolean('active_only')) {
            $q->where('is_active', true);
        }
        if ($cat = $request->input('category')) {
            $q->where('category', $cat);
        }
        if ($search = $request->input('query')) {
            $term = '%'.$search.'%';
            $q->where(fn ($b) => $b->where('label', 'like', $term)->orWhere('code', 'like', $term));
        }

        return response()->json(['data' => $q->paginate(min((int) $request->input('limit', 50), 100))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:40|unique:tariff_items,code',
            'label' => 'required|string|max:255',
            'category' => 'required|in:CONSULTATION,HOSPITALIZATION,ACT,LAB,IMAGING,DRUG,OTHER',
            'unit_price' => 'required|integer|min:0',
            'cost_center_id' => 'nullable|exists:cost_centers,id',
            'is_active' => 'boolean',
        ]);

        return response()->json(['data' => TariffItem::create($data)->load('costCenter')], 201);
    }

    public function update(Request $request, TariffItem $tariffItem): JsonResponse
    {
        $data = $request->validate([
            'code' => 'sometimes|string|max:40|unique:tariff_items,code,'.$tariffItem->id,
            'label' => 'sometimes|string|max:255',
            'category' => 'sometimes|in:CONSULTATION,HOSPITALIZATION,ACT,LAB,IMAGING,DRUG,OTHER',
            'unit_price' => 'sometimes|integer|min:0',
            'cost_center_id' => 'nullable|exists:cost_centers,id',
            'is_active' => 'boolean',
        ]);
        $tariffItem->update($data);

        return response()->json(['data' => $tariffItem->fresh('costCenter')]);
    }
}
