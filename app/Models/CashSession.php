<?php

namespace App\Models;

use App\Enums\CashSessionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashSession extends Model
{
    protected $fillable = [
        'opened_by', 'closed_by', 'status', 'opening_float', 'expected_cash',
        'closing_amount', 'variance', 'opened_at', 'closed_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => CashSessionStatus::class,
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'opening_float' => 'integer',
            'expected_cash' => 'integer',
            'closing_amount' => 'integer',
            'variance' => 'integer',
        ];
    }

    public function opener(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
