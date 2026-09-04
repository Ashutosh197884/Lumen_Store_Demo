<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    public const STATUS_CREATED = 'created';
    public const STATUS_PAID = 'paid';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_SHIPPED = 'shipped';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_CANCELLED = 'cancelled';

    public const FLOW = [
        self::STATUS_CREATED,
        self::STATUS_PAID,
        self::STATUS_PROCESSING,
        self::STATUS_SHIPPED,
        self::STATUS_DELIVERED,
    ];

    protected $fillable = [
        'ref', 'customer_id', 'status', 'subtotal', 'shipping', 'discount', 'total',
        'shipping_name', 'shipping_email', 'shipping_phone', 'shipping_address',
        'shipping_city', 'shipping_country', 'events',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'shipping' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
            'events' => 'array',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function addEvent(string $status, string $note): void
    {
        $events = $this->events ?? [];
        $events[] = ['status' => $status, 'at' => now()->toISOString(), 'note' => $note];
        $this->events = $events;
    }

    /** Move along the lifecycle; appends to the tracking timeline. */
    public function transitionTo(string $status, string $note): bool
    {
        $allowed = match ($this->status) {
            self::STATUS_CREATED => [self::STATUS_PAID, self::STATUS_CANCELLED],
            self::STATUS_PAID => [self::STATUS_PROCESSING, self::STATUS_CANCELLED],
            self::STATUS_PROCESSING => [self::STATUS_SHIPPED, self::STATUS_CANCELLED],
            self::STATUS_SHIPPED => [self::STATUS_DELIVERED, self::STATUS_CANCELLED],
            default => [],
        };

        if (! in_array($status, $allowed, true)) {
            return false;
        }

        $this->addEvent($status, $note);
        $this->status = $status;

        return true;
    }

    public static function nextRef(): string
    {
        $last = (int) str_replace('LM-', '', self::query()->max('ref') ?? 'LM-8401');
        return 'LM-'.($last + 1);
    }
}
