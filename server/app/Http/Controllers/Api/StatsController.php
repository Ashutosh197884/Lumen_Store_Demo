<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;

class StatsController extends Controller
{
    public function overview()
    {
        $liveRevenue = Order::query()->where('status', '!=', Order::STATUS_CANCELLED);

        $revenue = round((clone $liveRevenue)->sum('total'), 2);
        $last7Orders = (clone $liveRevenue)->where('created_at', '>=', now()->subDays(7))->count();

        $byDay = collect(range(6, 0))->map(function (int $daysAgo) use ($liveRevenue) {
            $day = Carbon::today()->subDays($daysAgo);
            $dayOrders = Order::query()
                ->whereDate('created_at', $day)
                ->where('status', '!=', Order::STATUS_CANCELLED);

            return [
                'day' => $day->format('m-d'),
                'orders' => (clone $dayOrders)->count(),
                'revenue' => round((clone $dayOrders)->sum('total'), 2),
            ];
        });

        $activeProducts = Product::query()->live();
        $lowStock = Product::query()->live()->lowStock()->get(['id', 'slug', 'name', 'stock', 'art']);

        return [
            'stats' => [
                'revenue' => $revenue,
                'orders' => Order::count(),
                'customers' => Customer::count(),
                'products' => (clone $activeProducts)->count(),
                'lowStock' => $lowStock->count(),
                'outOfStock' => (clone $activeProducts)->where('stock', 0)->count(),
                'last7Orders' => $last7Orders,
                'pendingOrders' => Order::whereIn('status', [Order::STATUS_PAID, Order::STATUS_PROCESSING])->count(),
            ],
            'lowStock' => $lowStock,
            'recentOrders' => Order::with('customer:id,name,email', 'items')
                ->orderByDesc('created_at')
                ->limit(6)
                ->get(),
            'byDay' => $byDay,
        ];
    }
}
