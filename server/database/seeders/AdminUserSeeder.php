<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@lumen.test'],
            [
                'name' => 'Store Admin',
                'email' => 'admin@lumen.test',
                'password' => 'demo', // hashed automatically via the User model cast
                'role' => 'admin',
            ],
        );
    }
}
