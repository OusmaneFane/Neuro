<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AccountingJournalEntry extends Model
{
    protected $fillable = [
        'entry_date', 'label', 'debit', 'credit', 'cost_center_id',
        'source_type', 'source_id', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'entry_date' => 'date',
            'debit' => 'integer',
            'credit' => 'integer',
        ];
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}
