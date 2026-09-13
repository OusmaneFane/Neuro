<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_complementary_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('imagerie')->nullable();
            $table->json('exploration')->nullable();
            $table->json('biologie')->nullable();
            $table->text('traitement_entree')->nullable();
            $table->text('traitement_sortie')->nullable();
            $table->string('evolution', 50)->nullable();
            $table->text('evolution_justification')->nullable();
            $table->string('mode_sortie', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_complementary_data');
    }
};
