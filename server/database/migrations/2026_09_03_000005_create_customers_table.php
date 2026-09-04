<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Guest checkout identity — deduped by email. Staff live in `users`.
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('city')->nullable();
            $table->string('country', 2)->nullable();
            $table->timestamps();
        });

        // Admin/staff flag for store operators (client gates are UX; this is real).
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('staff')->after('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
