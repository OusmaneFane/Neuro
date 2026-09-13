<?php

namespace Database\Factories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

class PatientFactory extends Factory
{
    protected $model = Patient::class;

    public function definition(): array
    {
        return [
            'iup' => 'IUP'.fake()->unique()->numerify('########'),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'birth_date' => fake()->dateTimeBetween('-80 years', '-1 year'),
            'sex' => fake()->randomElement(['M', 'F']),
            'phone' => fake()->optional(0.8)->phoneNumber(),
            'address' => fake()->optional(0.7)->address(),
            'emergency_contact' => fake()->optional(0.6)->name(),
            'status' => 'active',
        ];
    }
}
