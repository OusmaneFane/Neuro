<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InvoiceLine extends Model
{
    protected $fillable = [
        'invoice_id', 'tariff_item_id', 'product_id', 'label', 'quantity',
        'unit_price', 'discount', 'line_total', 'cost_center_id', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'integer',
            'discount' => 'integer',
            'line_total' => 'integer',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function tariffItem(): BelongsTo
    {
        return $this->belongsTo(TariffItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(AnalyticalAllocation::class);
    }
}
