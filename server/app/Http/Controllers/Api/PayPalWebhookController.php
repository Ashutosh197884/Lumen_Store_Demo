<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Receives PayPal webhooks (never the browser). The only events that matter
 * here:
 *   CHECKOUT.ORDER.APPROVED  → buyer clicked "approve" on paypal.com — capture.
 *   PAYMENT.CAPTURE.COMPLETED → capture confirmed — mark the order paid.
 * Payments are idempotent, mirroring StripeWebhookController.
 */
class PayPalWebhookController extends Controller
{
    public function __construct(private readonly PayPalService $paypal)
    {
    }

    public function handle(Request $request)
    {
        $payload = $request->json()->all();

        if (! $this->paypal->verifyWebhook($payload, $request->headers->all())) {
            Log::warning('PayPal webhook verification failed');

            return response('Webhook verification failed', 400);
        }

        match ($payload['event_type'] ?? null) {
            'CHECKOUT.ORDER.APPROVED' => $this->captureAndMarkPaid($payload),
            'PAYMENT.CAPTURE.COMPLETED' => $this->markPaid($payload),
            default => null, // ignore everything else (AUDIT etc.)
        };

        return response('ok');
    }

    private function captureAndMarkPaid(array $payload): void
    {
        $orderId = data_get($payload, 'resource.id');

        try {
            $capture = $this->paypal->captureOrder($orderId);
        } catch (\Throwable $e) {
            Log::error('PayPal capture failed', ['order' => $orderId, 'error' => $e->getMessage()]);

            return;
        }

        $this->markPaid($payload, $capture);
    }

    private function markPaid(array $payload, array $capture = []): void
    {
        $paypalOrderId = data_get($payload, 'resource.supplementary_data.related_ids.order_id')
            ?? data_get($payload, 'resource.id');

        $payment = Payment::where('paypal_order_id', $paypalOrderId)->with('order.items.product')->first();

        if (! $payment || $payment->status === 'paid') {
            return; // already handled (PayPal may deliver duplicates)
        }

        DB::transaction(function () use ($payment, $capture, $payload) {
            $payment->update([
                'status' => 'paid',
                'paypal_email' => data_get($capture, 'payer.email_address')
                    ?? data_get($payload, 'resource.payer.email_address'),
                'raw' => $payload,
            ]);

            $order = $payment->order;
            $order->transitionTo(Order::STATUS_PAID, 'Payment captured via PayPal');
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