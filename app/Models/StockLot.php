<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockLot extends Model
{
    protected $fillable = [
        'product_id', 'lot_number', 'expiry_date', 'qty_on_hand', 'unit_cost', 'location',
    ];

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
            'qty_on_hand' => 'decimal:2',
            'unit_cost' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }
}
