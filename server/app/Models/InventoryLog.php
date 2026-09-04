<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InventoryLog extends Model
{
    protected $fillable = ['product_id', 'delta', 'reason', 'stock_after', 'actor_type', 'actor_id'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function actor(): MorphTo
    {
        return $this->morphTo();
    }
}
