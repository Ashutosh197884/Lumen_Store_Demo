<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'slug', 'name', 'category_id', 'description', 'features', 'price', 'compare_at_price',
        'stock', 'low_stock_threshold', 'sku', 'unit', 'badges', 'art', 'rating',
        'review_count', 'featured', 'active',
    ];

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'badges' => 'array',
            'price' => 'decimal:2',
            'compare_at_price' => 'decimal:2',
            'featured' => 'boolean',
            'active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort');
    }

    public function inventoryLogs(): HasMany
    {
        return $this->hasMany(InventoryLog::class);
    }

    public function scopeLive(Builder $q): Builder
    {
        return $q->where('active', true);
    }

    public function scopeLowStock(Builder $q): Builder
    {
        return $q->whereColumn('stock', '<=', 'low_stock_threshold');
    }

    public function outOfStock(): bool
    {
        return $this->stock <= 0;
    }

    public function isLowStock(): bool
    {
        return $this->stock > 0 && $this->stock <= $this->low_stock_threshold;
    }

    /** Atomically reduce stock and audit the movement. */
    public function takeStock(int $qty, string $reason, ?Model $actor = null): bool
    {
        if ($qty <= 0 || $this->stock < $qty) {
            return false;
        }

        return $this->getConnection()->transaction(function () use ($qty, $reason, $actor) {
            $this->decrement('stock', $qty);
            $this->inventoryLogs()->create([
                'delta' => -$qty,
                'reason' => $reason,
                'stock_after' => $this->fresh()->stock,
                'actor_type' => $actor?->getMorphClass(),
                'actor_id' => $actor?->getKey(),
            ]);
            return true;
        });
    }

    public function addStock(int $qty, string $reason, ?Model $actor = null): void
    {
        $this->increment('stock', $qty);
        $this->inventoryLogs()->create([
            'delta' => $qty,
            'reason' => $reason,
            'stock_after' => $this->fresh()->stock,
            'actor_type' => $actor?->getMorphClass(),
            'actor_id' => $actor?->getKey(),
        ]);
    }
}
