<?php

namespace Database\Factories;

use App\Enums\EpisodeType;
use App\Models\Episode;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

class EpisodeFactory extends Factory
{
    protected $model = Episode::class;

    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('-2 years', 'now');
        $hasEnd = fake()->boolean(0.6);

        return [
            'patient_id' => Patient::factory(),
            'type' => fake()->randomElement(EpisodeType::cases()),
            'start_date' => $startDate,
            'end_date' => $hasEnd ? fake()->dateTimeBetween($startDate, 'now') : null,
            'reason' => fake()->randomElement([
                'Consultation de routine',
                'Douleurs abdominales',
                'Grippe',
                'Fracture',
                'Surveillance post-opératoire',
                'Urgence cardiaque',
                'Examen annuel',
            ]),
            'therapeutic_pathway' => fake()->optional(0.5)->randomElement([
                'Surveillance ambulatoire simple (rendez-vous de contrôle)',
                'Bilan complémentaire en cours (imagerie, neurophysio, biologie)',
                'Hospitalisation en urgence / passage aux urgences neuro',
            ]),
            'provenance' => fake()->optional(0.45)->randomElement([
                'Médecin traitant ou généraliste',
                'Service des urgences du même établissement',
                'Consultation spontanée / venue directe aux urgences ou au cabinet',
            ]),
            'diagnosis' => fake()->optional(0.8)->sentence(6),
            'complications' => fake()->optional(0.2)->sentence(4),
            'discharge_date' => $hasEnd ? fake()->dateTimeBetween($startDate, 'now') : null,
            'discharge_reason' => fake()->optional(0.7)->sentence(3),
            'notes' => fake()->optional(0.5)->paragraph(),
        ];
    }
}
