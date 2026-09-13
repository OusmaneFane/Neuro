<?php

namespace App\Http\Controllers\Api\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function categories(Request $request): JsonResponse
    {
        $q = ProductCategory::query()->orderBy('name');
        if ($request->boolean('active_only')) {
            $q->where('is_active', true);
        }

        return response()->json(['data' => $q->get()]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:30|unique:product_categories,code',
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        return response()->json(['data' => ProductCategory::create($data)], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $q = Product::query()->with(['category:id,code,name', 'costCenter:id,code,name'])
            ->withSum('lots as stock_total', 'qty_on_hand');

        if ($request->boolean('active_only')) {
            $q->where('is_active', true);
        }
        if ($cat = $request->input('category_id')) {
            $q->where('product_category_id', $cat);
        }
        if ($search = $request->input('query')) {
            $term = '%'.$search.'%';
            $q->where(fn ($b) => $b->where('name', 'like', $term)
                ->orWhere('code', 'like', $term)
                ->orWhere('dci', 'like', $term));
        }

        return response()->json($q->orderBy('name')->paginate(min((int) $request->input('limit', 30), 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:40|unique:products,code',
            'name' => 'required|string|max:255',
            'dci' => 'nullable|string|max:255',
            'form' => 'nullable|string|max:100',
            'dosage' => 'nullable|string|max:100',
            'unit' => 'required|in:BOX,UNIT,ML,G,TABLET,VIAL,OTHER',
            'product_category_id' => 'nullable|exists:product_categories,id',
            'tariff_item_id' => 'nullable|exists:tariff_items,id',
            'cost_center_id' => 'nullable|exists:cost_centers,id',
            'min_stock' => 'nullable|integer|min:0',
            'requires_expiry' => 'boolean',
            'sale_price' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        return response()->json(['data' => Product::create($data)->load('category')], 201);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['category', 'lots' => fn ($q) => $q->orderBy('expiry_date'), 'costCenter']);
        $product->stock_total = $product->lots->sum('qty_on_hand');

        return response()->json(['data' => $product]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'code' => 'sometimes|string|max:40|unique:products,code,'.$product->id,
            'name' => 'sometimes|string|max:255',
            'dci' => 'nullable|string|max:255',
            'form' => 'nullable|string|max:100',
            'dosage' => 'nullable|string|max:100',
            'unit' => 'sometimes|in:BOX,UNIT,ML,G,TABLET,VIAL,OTHER',
            'product_category_id' => 'nullable|exists:product_categories,id',
            'tariff_item_id' => 'nullable|exists:tariff_items,id',
            'cost_center_id' => 'nullable|exists:cost_centers,id',
            'min_stock' => 'nullable|integer|min:0',
            'requires_expiry' => 'boolean',
            'sale_price' => 'sometimes|integer|min:0',
            'is_active' => 'boolean',
        ]);
        $product->update($data);

        return response()->json(['data' => $product->fresh('category')]);
    }
}
