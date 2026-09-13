<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->canAccessClinical();
    }

    public function view(User $user, Document $document): bool
    {
        if ($user->role->canAccessClinical()) {
            return true;
        }

        return $user->role === UserRole::PATIENT
            && $user->patient?->id === $document->patient_id;
    }

    public function create(User $user): bool
    {
        return $user->role->canWriteClinical();
    }
}
