<?php

namespace App\Models;

use App\Enums\ShareScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ShareToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'token',
        'patient_id',
        'expires_at',
        'scope',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'scope' => ShareScope::class,
            'expires_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public static function generateToken(): string
    {
        do {
            $token = Str::random(64);
        } while (self::where('token', $token)->exists());

        return $token;
    }
}
