<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
        });

        Schema::table('episodes', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('patient_id')->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
        });

        Schema::table('clinical_notes', function (Blueprint $table) {
            $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->after('deleted_at')->constrained('users')->nullOnDelete();
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->after('deleted_at')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
        });

        Schema::table('episodes', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
        });

        Schema::table('clinical_notes', function (Blueprint $table) {
            $table->dropForeign(['updated_by']);
            $table->dropForeign(['deleted_by']);
            $table->dropSoftDeletes();
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['deleted_by']);
            $table->dropSoftDeletes();
        });
    }
};
