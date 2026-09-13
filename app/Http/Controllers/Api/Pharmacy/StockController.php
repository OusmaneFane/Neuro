<?php

namespace App\Http\Controllers\Api\Pharmacy;

use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Models\StockLot;
use App\Models\StockMovement;
use App\Services\Pharmacy\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function __construct(protected StockService $stock) {}

    public function lots(Request $request): JsonResponse
    {
        $q = StockLot::with('product:id,code,name,unit,min_stock')
            ->where('qty_on_hand', '>', 0)
            ->orderBy('expiry_date');

        if ($productId = $request->input('product_id')) {
            $q->where('product_id', $productId);
        }

        $lots = $q->paginate(min((int) $request->input('limit', 50), 100));
        $valuation = (int) StockLot::selectRaw('coalesce(sum(qty_on_hand * unit_cost),0) as v')->value('v');

        return response()->json([
            'data' => $lots->items(),
            'meta' => [
                'current_page' => $lots->currentPage(),
                'last_page' => $lots->lastPage(),
                'total' => $lots->total(),
                'stock_valuation' => $valuation,
            ],
        ]);
    }

    public function movements(Request $request): JsonResponse
    {
        $q = StockMovement::with(['lot.product:id,code,name', 'creator:id,full_name'])->orderByDesc('created_at');
        if ($type = $request->input('type')) {
            $q->where('type', $type);
        }
        if ($productId = $request->input('product_id')) {
            $q->whereHas('lot', fn ($l) => $l->where('product_id', $productId));
        }

        return response()->json($q->paginate(min((int) $request->input('limit', 40), 100)));
    }

    public function alerts(): JsonResponse
    {
        return response()->json($this->stock->alerts());
    }

    public function adjust(Request $request, StockLot $stockLot): JsonResponse
    {
        $data = $request->validate([
            'qty_on_hand' => 'required|numeric|min:0',
            'reason' => 'nullable|string|max:255',
        ]);

        $lot = $this->stock->adjustLot($stockLot, (float) $data['qty_on_hand'], (int) auth()->id(), $data['reason'] ?? null);

        return response()->json(['data' => $lot->load('product')]);
    }

    public function manualIn(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'lot_number' => 'required|string|max:100',
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'nullable|integer|min:0',
            'expiry_date' => 'nullable|date',
            'location' => 'nullable|string|max:100',
            'reason' => 'nullable|string|max:255',
        ]);

        $lot = $this->stock->increaseLot(
            (int) $data['product_id'],
            $data['lot_number'],
            (float) $data['quantity'],
            (int) ($data['unit_cost'] ?? 0),
            $data['expiry_date'] ?? null,
            $data['location'] ?? null,
            StockMovementType::IN_PURCHASE,
            null,
            (int) auth()->id(),
            $data['reason'] ?? 'Entrée manuelle'
        );

        return response()->json(['data' => $lot->load('product')], 201);
    }
}
