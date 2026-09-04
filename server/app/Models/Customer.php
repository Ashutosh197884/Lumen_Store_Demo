<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = ['email', 'name', 'phone', 'city', 'country'];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** Find by email or create — guest checkout identity. */
    public static function firstOrCreateByEmail(array $data): self
    {
        return static::firstOrCreate(
            ['email' => strtolower($data['email'])],
            $data,
        );
    }
}
