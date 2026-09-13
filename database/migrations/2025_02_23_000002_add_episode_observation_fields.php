<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('episodes', function (Blueprint $table) {
            $table->string('transport_mean', 30)->nullable()->after('type'); // taxi, ambulance, personnel
            $table->text('medical_history')->nullable()->after('reason'); // histoire maladie
            $table->text('dietary_habits')->nullable()->after('medical_history'); // habitude alimentaire
            $table->text('clinical_exam')->nullable()->after('dietary_habits'); // examen clinique
        });
    }

    public function down(): void
    {
        Schema::table('episodes', function (Blueprint $table) {
            $table->dropColumn(['transport_mean', 'medical_history', 'dietary_habits', 'clinical_exam']);
        });
    }
};
