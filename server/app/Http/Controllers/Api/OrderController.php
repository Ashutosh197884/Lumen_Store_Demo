<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        // Admin listing (route is inside the admin group).
        return ['data' => Order::query()
            ->with('customer', 'items', 'payment')
            ->when($request->filled('status') && $request->status !== 'all', fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 50))];
    }

    public function show(Request $request, string $ref)
    {
        $order = Order::with('customer', 'items', 'payment')
            ->where('ref', strtoupper($ref))
            ->firstOrFail();

        // Guests prove ownership with their email; admins may view any order.
        // auth('sanctum')->user() resolves the bearer token lazily so the route
        // stays public for guests while still recognizing admins.
        $admin = auth('sanctum')->user();

        abort_unless(
            $order->customer?->email === $request->query('email')
                || $admin?->isAdmin(),
            403
        );

        return $order;
    }

    public function updateStatus(Request $request, string $ref)
    {
        $request->validate([
            'status' => ['required', 'in:paid,processing,shipped,delivered,cancelled'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $order = Order::where('ref', strtoupper($ref))->firstOrFail();

        if (! $order->transitionTo($request->status, $request->note ?? 'Status updated by admin')) {
            return response()->json(['message' => "Cannot move an order from {$order->status} to {$request->status}."], 422);
        }

        // Cancelling a paid order marks its payment for refund (Stripe refund happens in PaymentService).
        if ($request->status === Order::STATUS_CANCELLED && $order->payment?->status === 'paid') {
            $order->payment->update(['status' => 'refunded']);
        }

        $order->save();

        return $order->load('customer', 'items', 'payment');
    }
}
