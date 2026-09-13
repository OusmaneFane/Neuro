<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('episodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30); // CONSULTATION, HOSPITALIZATION, EMERGENCY
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('reason')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('complications')->nullable();
            $table->date('discharge_date')->nullable();
            $table->string('discharge_reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('episodes');
    }
};
