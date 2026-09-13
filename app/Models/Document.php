<?php

namespace App\Models;

use App\Enums\DocumentType;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'patient_id',
        'episode_id',
        'type',
        'filename',
        'path',
        'mime',
        'size',
        'created_by',
        'deleted_by',
    ];

    protected static function booted(): void
    {
        static::deleting(function (self $model) {
            if (! $model->isForceDeleting() && auth()->check()) {
                $model->deleted_by = auth()->id();
            }
        });
    }

    protected function casts(): array
    {
        return [
            'deleted_at' => 'datetime',
            'type' => DocumentType::class,
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function episode(): BelongsTo
    {
        return $this->belongsTo(Episode::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function deleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }

    public function isViewable(): bool
    {
        return in_array($this->mime, [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
        ]);
    }
}
