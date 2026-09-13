<?php

namespace App\Models;

use App\Enums\ProductUnit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'code', 'name', 'dci', 'form', 'dosage', 'unit', 'product_category_id',
        'tariff_item_id', 'cost_center_id', 'min_stock', 'requires_expiry',
        'sale_price', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'unit' => ProductUnit::class,
            'min_stock' => 'integer',
            'requires_expiry' => 'boolean',
            'sale_price' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'product_category_id');
    }

    public function tariffItem(): BelongsTo
    {
        return $this->belongsTo(TariffItem::class);
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    public function lots(): HasMany
    {
        return $this->hasMany(StockLot::class);
    }

    public function totalStock(): float
    {
        return (float) $this->lots()->sum('qty_on_hand');
    }
}
