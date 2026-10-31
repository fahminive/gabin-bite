<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard and receive expected props', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->where('auth.user.role', 'finance')
        ->has('startDate')
        ->has('endDate')
        ->has('timelineTemplate')
        ->has('metrics')
        ->has('metrics.saldoKas')
        ->has('metrics.labaBersih')
        ->has('metrics.piutangAktif')
        ->has('metrics.hutangAktif')
        ->has('incomeTrend')
        ->has('cashFlowTrend')
        ->has('outflowBreakdown')
        ->has('cashFlowComparison')
        ->has('labaRugiBreakdown')
        ->has('labaRugiBreakdown.pendapatan')
        ->has('labaRugiBreakdown.hpp')
        ->has('labaRugiBreakdown.operasional')
        ->has('labaRugiBreakdown.labaBersih')
        ->has('manufacturingEfficiency')
        ->has('manufacturingEfficiency.produksiHpp')
        ->has('manufacturingEfficiency.bahanBakuDipakaiCost')
        ->has('miniBalanceSheet')
        ->has('miniBalanceSheet.totalAset')
        ->has('miniBalanceSheet.kewajiban')
        ->has('miniBalanceSheet.ekuitas')
        ->has('miniBalanceSheet.totalPasiva')
        ->has('topCustomers')
        ->has('topSuppliers')
        ->has('bestSellers')
        ->has('criticalMaterials')
        ->has('dueReceivables')
    );
});