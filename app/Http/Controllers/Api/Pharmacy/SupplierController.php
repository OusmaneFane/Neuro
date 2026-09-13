<?php

namespace App\Http\Controllers\Api\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Supplier::query()->orderBy('name');
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
            'code' => 'required|string|max:30|unique:suppliers,code',
            'name' => 'required|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'tax_id' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'lead_time_days' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        return response()->json(['data' => Supplier::create($data)], 201);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate([
            'code' => 'sometimes|string|max:30|unique:suppliers,code,'.$supplier->id,
            'name' => 'sometimes|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'tax_id' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'lead_time_days' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);
        $supplier->update($data);

        return response()->json(['data' => $supplier->fresh()]);
    }
}
