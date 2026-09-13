<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Patient;
use App\Models\User;

class PatientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->canLookupPatients();
    }

    public function view(User $user, Patient $patient): bool
    {
        if ($user->role->canLookupPatients()) {
            return true;
        }

        return $user->role === UserRole::PATIENT && $user->patient?->id === $patient->id;
    }

    public function create(User $user): bool
    {
        return $user->role->canWriteClinical();
    }

    public function update(User $user, Patient $patient): bool
    {
        return $user->role->canWriteClinical();
    }
}
