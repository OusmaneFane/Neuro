<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->string('laterality', 20)->nullable()->after('sex'); // droitiere, gauchère, ambidextre
            $table->string('education_level', 100)->nullable()->after('address');
            $table->string('profession', 255)->nullable()->after('education_level');
            $table->string('marital_status', 50)->nullable()->after('profession');
            $table->string('treating_doctor', 255)->nullable()->after('marital_status');
            $table->text('usual_treatment')->nullable()->after('treating_doctor');
            $table->string('emergency_contact_name', 255)->nullable()->after('usual_treatment');
            $table->string('emergency_contact_first_name', 255)->nullable()->after('emergency_contact_name');
            $table->string('emergency_contact_phone', 30)->nullable()->after('emergency_contact_first_name');
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn([
                'laterality', 'education_level', 'profession', 'marital_status',
                'treating_doctor', 'usual_treatment',
                'emergency_contact_name', 'emergency_contact_first_name', 'emergency_contact_phone',
            ]);
        });
    }
};
