<?php

namespace App\Models;

use App\Enums\InventoryCountStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryCount extends Model
{
    protected $fillable = [
        'number', 'status', 'started_at', 'validated_at', 'notes', 'created_by', 'validated_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => InventoryCountStatus::class,
            'started_at' => 'datetime',
            'validated_at' => 'datetime',
        ];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InventoryCountLine::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
