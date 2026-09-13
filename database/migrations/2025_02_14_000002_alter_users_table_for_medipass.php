<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'full_name')) {
                $table->string('full_name')->nullable()->after('id');
            }
            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role', 20)->default('PATIENT')->after('password');
            }
            if (! Schema::hasColumn('users', 'hospital_id')) {
                $table->foreignId('hospital_id')->nullable()->after('role')->constrained('hospitals')->nullOnDelete();
            }
        });

        // Migrate name to full_name if both exist
        $hasName = Schema::hasColumn('users', 'name');
        $hasFullName = Schema::hasColumn('users', 'full_name');
        if ($hasName && $hasFullName) {
            \DB::table('users')->whereNull('full_name')->update(['full_name' => \DB::raw('name')]);
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'two_factor_secret')) {
                $table->dropColumn(['two_factor_secret', 'two_factor_recovery_codes', 'two_factor_confirmed_at']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['hospital_id']);
            $table->dropColumn(['full_name', 'role', 'hospital_id']);
        });
    }
};
