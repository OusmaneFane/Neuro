<?php

namespace App\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role->canWriteClinical() ?? false;
    }

    public function rules(): array
    {
        $patient = $this->route('patient');
        $patientId = $patient instanceof \App\Models\Patient ? $patient->id : $patient;

        return [
            'iup' => ['sometimes', 'string', 'max:50', Rule::unique('patients', 'iup')->ignore($patientId)],
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'birth_date' => ['sometimes', 'date'],
            'sex' => ['sometimes', 'string', Rule::in(['M', 'F'])],
            'laterality' => ['nullable', 'string', 'max:20', Rule::in(['droitiere', 'gauchere', 'ambidextre'])],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'education_level' => ['nullable', 'string', 'max:100'],
            'profession' => ['nullable', 'string', 'max:255'],
            'marital_status' => ['nullable', 'string', 'max:50'],
            'treating_doctor' => ['nullable', 'string', 'max:255'],
            'usual_treatment' => ['nullable', 'string'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_first_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
            'status' => ['nullable', 'string', 'max:50'],
        ];
    }
}
