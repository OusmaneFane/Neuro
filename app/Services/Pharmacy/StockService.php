<?php

namespace App\Services\Pharmacy;

use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\StockLot;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class StockService
{
    public function increaseLot(
        int $productId,
        string $lotNumber,
        float $qty,
        int $unitCost,
        ?string $expiryDate,
        ?string $location,
        StockMovementType $type,
        ?Model $reference,
        ?int $userId,
        ?string $reason = null
    ): StockLot {
        return DB::transaction(function () use ($productId, $lotNumber, $qty, $unitCost, $expiryDate, $location, $type, $reference, $userId, $reason) {
            $lot = StockLot::firstOrCreate(
                ['product_id' => $productId, 'lot_number' => $lotNumber],
                [
                    'expiry_date' => $expiryDate,
                    'qty_on_hand' => 0,
                    'unit_cost' => $unitCost,
                    'location' => $location,
                ]
            );

            $lot->qty_on_hand = (float) $lot->qty_on_hand + $qty;
            if ($unitCost > 0) {
                $lot->unit_cost = $unitCost;
            }
            if ($expiryDate) {
                $lot->expiry_date = $expiryDate;
            }
            if ($location) {
                $lot->location = $location;
            }
            $lot->save();

            $this->recordMovement($lot, $type, $qty, $reference, $userId, $reason);

            return $lot->fresh();
        });
    }

    public function decreaseLot(
        StockLot $lot,
        float $qty,
        StockMovementType $type,
        ?Model $reference,
        ?int $userId,
        ?string $reason = null
    ): StockLot {
        if ((float) $lot->qty_on_hand < $qty) {
            abort(422, "Stock insuffisant pour le lot {$lot->lot_number}.");
        }

        return DB::transaction(function () use ($lot, $qty, $type, $reference, $userId, $reason) {
            $lot->qty_on_hand = (float) $lot->qty_on_hand - $qty;
            $lot->save();
            $this->recordMovement($lot, $type, $qty, $reference, $userId, $reason);

            return $lot->fresh();
        });
    }

    public function adjustLot(StockLot $lot, float $newQty, ?int $userId, ?string $reason = null): StockLot
    {
        $diff = $newQty - (float) $lot->qty_on_hand;
        if (abs($diff) < 0.0001) {
            return $lot;
        }

        return DB::transaction(function () use ($lot, $newQty, $diff, $userId, $reason) {
            $lot->qty_on_hand = $newQty;
            $lot->save();
            $this->recordMovement(
                $lot,
                StockMovementType::ADJUSTMENT,
                abs($diff),
                null,
                $userId,
                $reason ?? ($diff > 0 ? 'Ajustement +' : 'Ajustement -')
            );

            return $lot->fresh();
        });
    }

    /** Pick lots FEFO (first expiry first out). */
    public function pickFefo(int $productId, float $quantity): array
    {
        $remaining = $quantity;
        $picks = [];
        $lots = StockLot::where('product_id', $productId)
            ->where('qty_on_hand', '>', 0)
            ->orderByRaw('expiry_date is null')
            ->orderBy('expiry_date')
            ->lockForUpdate()
            ->get();

        foreach ($lots as $lot) {
            if ($remaining <= 0) {
                break;
            }
            $take = min((float) $lot->qty_on_hand, $remaining);
            $picks[] = ['lot' => $lot, 'quantity' => $take];
            $remaining -= $take;
        }

        if ($remaining > 0.0001) {
            $product = Product::find($productId);
            abort(422, 'Stock insuffisant pour '.($product?->name ?? "produit #{$productId}").'.');
        }

        return $picks;
    }

    public function alerts(): array
    {
        $lowStock = Product::query()
            ->withSum('lots as stock_total', 'qty_on_hand')
            ->where('is_active', true)
            ->get()
            ->filter(fn (Product $p) => (float) ($p->stock_total ?? 0) <= $p->min_stock)
            ->values()
            ->map(fn (Product $p) => [
                'type' => 'LOW_STOCK',
                'product_id' => $p->id,
                'product_name' => $p->name,
                'code' => $p->code,
                'qty' => (float) ($p->stock_total ?? 0),
                'min_stock' => $p->min_stock,
            ]);

        $expiring = StockLot::with('product:id,code,name')
            ->where('qty_on_hand', '>', 0)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', now()->addDays(90))
            ->orderBy('expiry_date')
            ->get()
            ->map(fn (StockLot $lot) => [
                'type' => $lot->expiry_date->lte(now()) ? 'EXPIRED' : ($lot->expiry_date->lte(now()->addDays(30)) ? 'EXPIRING_30' : 'EXPIRING_90'),
                'stock_lot_id' => $lot->id,
                'product_id' => $lot->product_id,
                'product_name' => $lot->product?->name,
                'lot_number' => $lot->lot_number,
                'expiry_date' => $lot->expiry_date?->format('Y-m-d'),
                'qty' => (float) $lot->qty_on_hand,
            ]);

        return [
            'low_stock' => $lowStock,
            'expiry' => $expiring,
        ];
    }

    protected function recordMovement(
        StockLot $lot,
        StockMovementType $type,
        float $qty,
        ?Model $reference,
        ?int $userId,
        ?string $reason
    ): void {
        StockMovement::create([
            'stock_lot_id' => $lot->id,
            'type' => $type,
            'quantity' => $qty,
            'reason' => $reason,
            'reference_type' => $reference ? $reference::class : null,
            'reference_id' => $reference?->getKey(),
            'created_by' => $userId,
        ]);
    }
}
