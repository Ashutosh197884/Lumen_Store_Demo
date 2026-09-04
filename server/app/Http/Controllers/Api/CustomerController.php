<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query()
            ->withCount('orders')
            ->withSum(['orders as total_spent' => fn ($q) => $q->where('status', '!=', 'cancelled')], 'total')
            ->when($request->filled('q'), function ($q) use ($request) {
                $s = '%'.$request->q.'%';
                $q->where(fn ($w) => $w->where('name', 'like', $s)->orWhere('email', 'like', $s));
            })
            ->orderByDesc(
                Customer::query()
                    ->selectRaw('MAX(orders.created_at)')
                    ->join('orders', 'orders.customer_id', '=', 'customers.id')
            );

        return ['data' => $query->paginate($request->integer('per_page', 100))];
    }
}
