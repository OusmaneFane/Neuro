<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'email',
        'password',
        'name',
        'full_name',
        'role',
        'hospital_id',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    protected static function booted(): void
    {
        // Legacy Laravel column `name` is NOT NULL — keep it aligned with `full_name`.
        static::saving(function (User $user) {
            $fullName = $user->attributes['full_name'] ?? null;
            if (filled($fullName)) {
                $user->setAttribute('name', $fullName);
            }
        });
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role->value,
        ];
    }

    public function hospital(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function patient(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Patient::class);
    }

    public function isHospitalStaff(): bool
    {
        return $this->role->isHospitalStaff();
    }

    public function isPatient(): bool
    {
        return $this->role === UserRole::PATIENT;
    }

    public function getFullNameAttribute(?string $value): string
    {
        return $value ?? $this->attributes['name'] ?? '';
    }
}
