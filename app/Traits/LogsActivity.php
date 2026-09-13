<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

trait LogsActivity
{
    public static function bootLogsActivity(): void
    {
        static::created(function (Model $model) {
            if (auth()->check()) {
                ActivityLog::log('created', $model, null, $model->getAttributes());
            }
        });

        static::updated(function (Model $model) {
            if (auth()->check() && $model->wasChanged()) {
                ActivityLog::log('updated', $model, $model->getOriginal(), $model->getAttributes());
            }
        });

        static::deleted(function (Model $model) {
            if (auth()->check()) {
                ActivityLog::log('deleted', $model, $model->getAttributes(), null);
            }
        });
    }
}
