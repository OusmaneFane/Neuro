<?php

namespace App\Http\Requests\Episode;

use App\Enums\EpisodeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEpisodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role->canWriteClinical() ?? false;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(array_column(EpisodeType::cases(), 'value'))],
            'transport_mean' => ['nullable', 'string', 'max:30', Rule::in(['taxi', 'ambulance', 'personnel'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'reason' => ['nullable', 'string', 'max:255'],
            'therapeutic_pathway' => ['nullable', 'string', 'max:255'],
            'provenance' => ['nullable', 'string', 'max:255'],
            'medical_history' => ['nullable', 'string'],
            'dietary_habits' => ['nullable', 'string'],
            'clinical_exam' => ['nullable', 'string'],
            'diagnosis' => ['nullable', 'string'],
            'complications' => ['nullable', 'string'],
            'discharge_date' => ['nullable', 'date'],
            'discharge_reason' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
