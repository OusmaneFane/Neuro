<?php

namespace App\Http\Controllers\Api\Pharmacy;

use App\Enums\InventoryCountStatus;
use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Models\InventoryCount;
use App\Models\InventoryCountLine;
use App\Models\StockLot;
use App\Services\Pharmacy\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryCountController extends Controller
{
    public function __construct(protected StockService $stock) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            InventoryCount::with('creator:id,full_name')
                ->orderByDesc('created_at')
                ->paginate(min((int) $request->input('limit', 20), 100))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['notes' => 'nullable|string']);

        $count = DB::transaction(function () use ($data) {
            $prefix = 'INV-'.now()->format('Ym');
            $last = InventoryCount::where('number', 'like', $prefix.'%')->orderByDesc('number')->value('number');
            $seq = $last ? ((int) Str::afterLast($last, '-')) + 1 : 1;

            $count = InventoryCount::create([
                'number' => sprintf('%s-%04d', $prefix, $seq),
                'status' => InventoryCountStatus::IN_PROGRESS,
                'started_at' => now(),
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            foreach (StockLot::where('qty_on_hand', '>', 0)->get() as $lot) {
                InventoryCountLine::create([
                    'inventory_count_id' => $count->id,
                    'stock_lot_id' => $lot->id,
                    'system_qty' => $lot->qty_on_hand,
                ]);
            }

            return $count->load(['lines.lot.product']);
        });

        return response()->json(['data' => $count], 201);
    }

    public function show(InventoryCount $inventoryCount): JsonResponse
    {
        $inventoryCount->load(['lines.lot.product', 'creator:id,full_name']);

        return response()->json(['data' => $inventoryCount]);
    }

    public function updateLines(Request $request, InventoryCount $inventoryCount): JsonResponse
    {
        if ($inventoryCount->status !== InventoryCountStatus::IN_PROGRESS) {
            abort(422, 'Inventaire non modifiable.');
        }

        $data = $request->validate([
            'lines' => 'required|array',
            'lines.*.id' => 'required|exists:inventory_count_lines,id',
            'lines.*.counted_qty' => 'required|numeric|min:0',
        ]);

        foreach ($data['lines'] as $row) {
            $line = InventoryCountLine::where('inventory_count_id', $inventoryCount->id)
                ->where('id', $row['id'])
                ->firstOrFail();
            $line->update([
                'counted_qty' => $row['counted_qty'],
                'variance' => (float) $row['counted_qty'] - (float) $line->system_qty,
            ]);
        }

        return response()->json(['data' => $inventoryCount->fresh('lines.lot.product')]);
    }

    public function validateCount(InventoryCount $inventoryCount): JsonResponse
    {
        if ($inventoryCount->status !== InventoryCountStatus::IN_PROGRESS) {
            abort(422, 'Inventaire déjà validé ou annulé.');
        }

        $count = DB::transaction(function () use ($inventoryCount) {
            foreach ($inventoryCount->lines()->with('lot')->get() as $line) {
                if ($line->counted_qty === null) {
                    continue;
                }
                $diff = (float) $line->counted_qty - (float) $line->system_qty;
                if (abs($diff) < 0.0001) {
                    continue;
                }
                $lot = $line->lot;
                $lot->qty_on_hand = (float) $line->counted_qty;
                $lot->save();
                \App\Models\StockMovement::create([
                    'stock_lot_id' => $lot->id,
                    'type' => StockMovementType::INVENTORY,
                    'quantity' => abs($diff),
                    'reason' => 'Inventaire '.$inventoryCount->number,
                    'reference_type' => InventoryCount::class,
                    'reference_id' => $inventoryCount->id,
                    'created_by' => auth()->id(),
                ]);
            }

            $inventoryCount->update([
                'status' => InventoryCountStatus::VALIDATED,
                'validated_at' => now(),
                'validated_by' => auth()->id(),
            ]);

            return $inventoryCount->fresh('lines.lot.product');
        });

        return response()->json(['data' => $count]);
    }
}
