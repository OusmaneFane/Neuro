<?php

namespace Database\Seeders;

use App\Enums\DocumentType;
use App\Enums\EpisodeType;
use App\Enums\ShareScope;
use App\Enums\UserRole;
use App\Models\Document;
use App\Models\Episode;
use App\Models\Hospital;
use App\Models\Patient;
use App\Models\ShareToken;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $hospital = Hospital::create([
            'name' => 'CHU Médical Principal',
            'currency_code' => 'XOF',
            'currency_label' => 'F CFA',
        ]);

        $admin = User::factory()->admin()->create([
            'email' => 'admin@medipass.test',
            'full_name' => 'Dr. Admin Système',
            'hospital_id' => $hospital->id,
        ]);

        $doctor = User::factory()->doctor()->hospitalStaff($hospital)->create([
            'email' => 'doctor@medipass.test',
            'full_name' => 'Dr. Marie Dupont',
            'hospital_id' => $hospital->id,
        ]);

        $nurse = User::factory()->nurse()->hospitalStaff($hospital)->create([
            'email' => 'nurse@medipass.test',
            'full_name' => 'Sophie Martin',
            'hospital_id' => $hospital->id,
        ]);

        $patientUser = User::factory()->patient()->create([
            'email' => 'patient@medipass.test',
            'full_name' => 'Jean Patient',
        ]);

        $patient = Patient::create([
            'iup' => 'IUP20240001',
            'first_name' => 'Jean',
            'last_name' => 'Patient',
            'birth_date' => '1985-03-15',
            'sex' => 'M',
            'phone' => '+33612345678',
            'address' => '12 rue de la Santé, 75014 Paris',
            'emergency_contact' => 'Marie Patient - 0612345679',
            'status' => 'active',
            'user_id' => $patientUser->id,
        ]);

        $episode1 = Episode::create([
            'patient_id' => $patient->id,
            'type' => EpisodeType::CONSULTATION,
            'start_date' => now()->subMonths(2),
            'end_date' => now()->subMonths(2),
            'reason' => 'Consultation de routine',
            'diagnosis' => 'Bilan sanguin normal, tension stable.',
            'notes' => 'Patient en bonne santé générale.',
        ]);

        $episode2 = Episode::create([
            'patient_id' => $patient->id,
            'type' => EpisodeType::EMERGENCY,
            'start_date' => now()->subMonth(),
            'end_date' => now()->subMonth()->addDays(2),
            'reason' => 'Douleurs thoraciques',
            'diagnosis' => 'Anxiété, pas de pathologie cardiaque.',
            'discharge_date' => now()->subMonth()->addDays(2),
            'discharge_reason' => 'Amélioration clinique',
        ]);

        $docPath = "documents/{$patient->id}";
        Storage::disk('public')->makeDirectory($docPath);
        Storage::disk('public')->put("{$docPath}/bilan.pdf", '%PDF-1.4 placeholder');
        Storage::disk('public')->put("{$docPath}/cr_urgence.pdf", '%PDF-1.4 placeholder');

        Document::create([
            'patient_id' => $patient->id,
            'episode_id' => $episode1->id,
            'type' => DocumentType::LAB,
            'filename' => 'bilan_sanguin_2024.pdf',
            'path' => "{$docPath}/bilan.pdf",
            'mime' => 'application/pdf',
            'size' => 125000,
            'created_by' => $doctor->id,
        ]);

        Document::create([
            'patient_id' => $patient->id,
            'episode_id' => $episode2->id,
            'type' => DocumentType::DISCHARGE,
            'filename' => 'compte_rendu_urgence.pdf',
            'path' => "{$docPath}/cr_urgence.pdf",
            'mime' => 'application/pdf',
            'size' => 89000,
            'created_by' => $doctor->id,
        ]);

        ShareToken::create([
            'token' => ShareToken::generateToken(),
            'patient_id' => $patient->id,
            'expires_at' => now()->addDays(7),
            'scope' => ShareScope::SUMMARY,
            'created_by' => $patientUser->id,
        ]);

        Patient::factory()->count(15)->create();
        $patients = Patient::where('id', '!=', $patient->id)->get();
        foreach ($patients->take(10) as $p) {
            Episode::factory()->create(['patient_id' => $p->id]);
            Episode::factory()->create(['patient_id' => $p->id]);
        }

        $this->call(FinancePharmacySeeder::class);

        $cnam = \App\Models\Payer::where('code', 'CNAM')->first();
        if ($cnam) {
            \App\Models\PatientCoverage::updateOrCreate(
                ['patient_id' => $patient->id, 'payer_id' => $cnam->id],
                [
                    'member_number' => 'CNAM-DEMO-001',
                    'coverage_rate' => 80,
                    'ceiling_amount' => 500000,
                    'starts_on' => now()->subYear()->toDateString(),
                    'is_primary' => true,
                    'is_active' => true,
                ]
            );
        }
    }
}
