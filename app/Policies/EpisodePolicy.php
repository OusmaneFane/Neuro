<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Episode;
use App\Models\User;

class EpisodePolicy
{
    public function view(User $user, Episode $episode): bool
    {
        if ($user->role->canAccessClinical()) {
            return true;
        }

        return $user->role === UserRole::PATIENT
            && $user->patient?->id === $episode->patient_id;
    }

    public function create(User $user): bool
    {
        return $user->role->canWriteClinical();
    }

    public function update(User $user, Episode $episode): bool
    {
        return $user->role->canWriteClinical();
    }
}
