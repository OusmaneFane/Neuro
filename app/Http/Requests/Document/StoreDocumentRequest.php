<?php

namespace App\Http\Requests\Document;

use App\Enums\DocumentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role->canWriteClinical() ?? false;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpeg,jpg,png,gif'],
            'type' => ['required', 'string', Rule::in(array_column(DocumentType::cases(), 'value'))],
            'episode_id' => ['nullable', 'integer', 'exists:episodes,id'],
        ];
    }
}
