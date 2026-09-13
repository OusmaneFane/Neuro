<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsReceiptLine extends Model
{
    protected $fillable = [
        'goods_receipt_id', 'product_id', 'purchase_order_line_id', 'lot_number',
        'expiry_date', 'quantity', 'unit_cost', 'location',
    ];

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
            'quantity' => 'decimal:2',
            'unit_cost' => 'integer',
        ];
    }

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(GoodsReceipt::class, 'goods_receipt_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
