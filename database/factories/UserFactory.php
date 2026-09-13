<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Hospital;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password = null;

    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => UserRole::PATIENT,
            'hospital_id' => null,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => UserRole::ADMIN]);
    }

    public function doctor(): static
    {
        return $this->state(fn () => ['role' => UserRole::DOCTOR]);
    }

    public function nurse(): static
    {
        return $this->state(fn () => ['role' => UserRole::NURSE]);
    }

    public function patient(): static
    {
        return $this->state(fn () => ['role' => UserRole::PATIENT]);
    }

    public function hospitalStaff(Hospital $hospital): static
    {
        return $this->state(fn () => ['hospital_id' => $hospital->id]);
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['email_verified_at' => null]);
    }
}
