<?php

namespace Database\Factories;

use App\Enums\DocumentType;
use App\Models\Document;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition(): array
    {
        $type = fake()->randomElement(DocumentType::cases());
        $prefixes = [
            'LAB' => 'Résultat_analyse_',
            'IMAGING' => 'Radio_',
            'PRESCRIPTION' => 'Ordonnance_',
            'DISCHARGE' => 'Compte_rendu_',
            'ADMIN' => 'Document_',
            'OTHER' => 'Doc_',
        ];
        $prefix = $prefixes[$type->value] ?? 'Doc_';

        return [
            'patient_id' => Patient::factory(),
            'episode_id' => null,
            'type' => $type,
            'filename' => $prefix.fake()->numerify('####').'.pdf',
            'path' => 'documents/dummy/placeholder.pdf',
            'mime' => 'application/pdf',
            'size' => fake()->numberBetween(50000, 2000000),
            'created_by' => null,
        ];
    }
}
