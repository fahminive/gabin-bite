<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'admin@sikeju.com'],
            [
                'name' => 'Super Admin',
                'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                'role' => 'admin',
            ]
        );

        User::firstOrCreate(
            ['email' => 'partner.a@sikeju.com'],
            [
                'name' => 'Partner A',
                'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                'role' => 'owner',
            ]
        );

        User::firstOrCreate(
            ['email' => 'partner.b@sikeju.com'],
            [
                'name' => 'Partner B',
                'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                'role' => 'owner',
            ]
        );

        User::firstOrCreate(
            ['email' => 'partner.c@sikeju.com'],
            [
                'name' => 'Partner C',
                'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                'role' => 'owner',
            ]
        );

        \App\Models\Mitra::ensureTrio();
    }
}
