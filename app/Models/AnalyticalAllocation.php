<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyticalAllocation extends Model
{
    protected $fillable = ['invoice_line_id', 'cost_center_id', 'amount', 'axis'];

    protected function casts(): array
    {
        return ['amount' => 'integer'];
    }

    public function invoiceLine(): BelongsTo
    {
        return $this->belongsTo(InvoiceLine::class);
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }
}
