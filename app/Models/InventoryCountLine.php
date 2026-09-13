<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryCountLine extends Model
{
    protected $fillable = [
        'inventory_count_id', 'stock_lot_id', 'system_qty', 'counted_qty', 'variance',
    ];

    protected function casts(): array
    {
        return [
            'system_qty' => 'decimal:2',
            'counted_qty' => 'decimal:2',
            'variance' => 'decimal:2',
        ];
    }

    public function inventoryCount(): BelongsTo
    {
        return $this->belongsTo(InventoryCount::class);
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(StockLot::class, 'stock_lot_id');
    }
}
