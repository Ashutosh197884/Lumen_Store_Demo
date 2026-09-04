<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\StripeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StripeWebhookController extends Controller
{
    public function __construct(private readonly StripeService $stripe)
    {
    }

    public function handle(Request $request)
    {
        try {
            $event = $this->stripe->verifyWebhook($request->getContent(), $request->header('Stripe-Signature'));
        } catch (\Throwable $e) {
            Log::warning('Stripe webhook verification failed', ['error' => $e->getMessage()]);

            return response('Webhook verification failed', 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $this->markPaid($event->data->object);
        }

        // Always acknowledge — Stripe retries otherwise.
        return response('ok');
    }

    private function markPaid(object $session): void
    {
        $payment = Payment::where('session_id', $session->id)->with('order.items.product')->first();

        if (! $payment || $payment->status === 'paid') {
            return; // already handled (Stripe may deliver duplicates)
        }

        DB::transaction(function () use ($payment, $session) {
            $payment->update([
                'status' => 'paid',
                'payment_intent' => $session->payment_intent ?? null,
                'card_brand' => $session->payment_method_details?->card?->brand ?? null,
                'card_last4' => $session->payment_method_details?->card?->last4 ?? null,
                'raw' => (array) $session,
            ]);

            $order = $payment->order;
            $order->transitionTo(Order::STATUS_PAID, 'Payment captured via Stripe');
            $order->save();

            // Stock is only consumed AFTER payment confirmation (never on session creation)
            foreach ($order->items as $item) {
                if ($item->product) {
                    $item->product->takeStock($item->qty, "order {$order->ref}");
                }
            }
        });
    }
}
