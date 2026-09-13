<?php

namespace App\Http\Requests\ShareToken;

use App\Enums\ShareScope;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreShareTokenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Handled in controller - patient or hospital staff
    }

    public function rules(): array
    {
        return [
            'scope' => ['required', 'string', Rule::in(array_column(ShareScope::cases(), 'value'))],
            'expires_in' => ['required', 'string', Rule::in(['1h', '24h', '7d'])],
        ];
    }
}
