<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Patient extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'iup',
        'first_name',
        'last_name',
        'birth_date',
        'sex',
        'laterality',
        'phone',
        'address',
        'education_level',
        'profession',
        'marital_status',
        'treating_doctor',
        'usual_treatment',
        'emergency_contact',
        'emergency_contact_name',
        'emergency_contact_first_name',
        'emergency_contact_phone',
        'status',
        'user_id',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function episodes(): HasMany
    {
        return $this->hasMany(Episode::class)->orderByDesc('start_date');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class)->orderByDesc('created_at');
    }

    public function shareTokens(): HasMany
    {
        return $this->hasMany(ShareToken::class);
    }

    public function clinicalNotes(): HasMany
    {
        return $this->hasMany(ClinicalNote::class)->orderByDesc('created_at');
    }

    public function complementaryData(): HasOne
    {
        return $this->hasOne(PatientComplementaryData::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /** Identifiant Unique Patient : IUP + année + séquence (ex. IUP20260001). */
    public static function generateIup(): string
    {
        $prefix = 'IUP'.now()->format('Y');
        $last = static::query()
            ->where('iup', 'like', $prefix.'%')
            ->orderByDesc('iup')
            ->value('iup');

        $seq = 1;
        if ($last && preg_match('/(\d+)$/', $last, $matches)) {
            $seq = ((int) $matches[1]) + 1;
        }

        return sprintf('%s%04d', $prefix, $seq);
    }

    public function activeShareTokens()
    {
        return $this->shareTokens()->where('expires_at', '>', now());
    }

    public function dossierDownloadLogs(): HasMany
    {
        return $this->hasMany(DossierDownloadLog::class);
    }

    public function coverages(): HasMany
    {
        return $this->hasMany(PatientCoverage::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->orderByDesc('created_at');
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class)->orderByDesc('created_at');
    }
}
