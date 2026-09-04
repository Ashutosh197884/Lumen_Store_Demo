<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'order_id', 'provider', 'session_id', 'payment_intent', 'status',
        'amount', 'card_brand', 'card_last4', 'paypal_order_id', 'paypal_email', 'raw',
    ];

    protected function casts(): array
    {
        return ['raw' => 'array'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
