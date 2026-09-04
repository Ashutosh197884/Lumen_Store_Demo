<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(AdminUserSeeder::class);

        $categories = [
            ['audio', 'Audio', 'from-indigo-500 to-violet-600'],
            ['wearables', 'Wearables', 'from-sky-500 to-indigo-600'],
            ['home', 'Home', 'from-amber-400 to-orange-500'],
            ['kitchen', 'Kitchen', 'from-rose-400 to-red-500'],
            ['on-the-go', 'On the Go', 'from-emerald-400 to-teal-600'],
        ];

        $ids = [];
        foreach ($categories as [$slug, $name, $gradient]) {
            $ids[$slug] = Category::updateOrCreate(['slug' => $slug], compact('name', 'gradient'))->id;
        }

        // Mirror of client/src/data/seedProducts.js — admin panel edits from here on.
        $products = [
            // slug, name, cat, price, compare, stock, art, badges, featured, rating, reviews
            ['wireless-headphones', 'Wireless Headphones', 'audio', 129, 159, 24, '🎧', ['Best Seller'], true, 4.6, 312],
            ['true-wireless-earbuds', 'True Wireless Earbuds', 'audio', 79, null, 40, '🎵', [], true, 4.4, 208],
            ['portable-speaker', 'Portable Speaker', 'audio', 189, 219, 9, '🔊', ['New'], false, 4.7, 156],
            ['smart-watch', 'Smart Watch', 'wearables', 199, null, 15, '⌚', [], true, 4.3, 98],
            ['fitness-band', 'Fitness Band', 'wearables', 59, null, 33, '🏃', [], false, 4.1, 74],
            ['smart-ring', 'Smart Ring', 'wearables', 149, null, 4, '💍', ['New', 'Limited'], false, 4.2, 41],
            ['desk-lamp', 'Desk Lamp', 'home', 49, null, 22, '💡', [], true, 4.5, 187],
            ['scented-candles', 'Scented Candles — Trio', 'home', 19, null, 0, '🕯️', [], false, 4.6, 231],
            ['woven-storage-basket', 'Woven Storage Basket', 'home', 34, null, 18, '🧺', [], false, 4.3, 64],
            ['coffee-maker', 'Pour-over Coffee Maker', 'kitchen', 149, 179, 11, '☕', ['Best Seller'], false, 4.7, 143],
            ['cast-iron-pan', 'Cast Iron Pan', 'kitchen', 59, null, 27, '🍳', [], true, 4.8, 356],
            ['glass-carafe', 'Glass Carafe & Pitcher', 'kitchen', 29, null, 0, '🍶', [], false, 4.2, 52],
            ['everyday-backpack', 'Everyday Backpack', 'on-the-go', 69, null, 30, '🎒', [], false, 4.5, 178],
            ['polarized-sunglasses', 'Polarized Sunglasses', 'on-the-go', 45, null, 26, '🕶️', [], false, 4.4, 89],
            ['insulated-tumbler', 'Insulated Tumbler', 'on-the-go', 35, null, 48, '🥤', [], false, 4.6, 412],
            ['wireless-charger', 'Wireless Charger', 'on-the-go', 39, null, 5, '🔌', [], false, 4.1, 97],
        ];

        foreach ($products as [$slug, $name, $cat, $price, $compare, $stock, $art, $badges, $featured, $rating, $reviews]) {
            Product::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'category_id' => $ids[$cat],
                    'description' => 'Thoughtfully made. Beautifully simple — see it in person: every detail is designed to last.',
                    'features' => ['Free returns within 30 days', '1-year warranty', 'Fast, tracked shipping'],
                    'price' => $price,
                    'compare_at_price' => $compare,
                    'stock' => $stock,
                    'sku' => 'LM-'.(1000 + $this->hashOf($slug) % 900),
                    'art' => $art,
                    'badges' => $badges,
                    'featured' => $featured,
                    'rating' => $rating,
                    'review_count' => $reviews,
                    'active' => true,
                ],
            );
        }
    }

    private function hashOf(string $s): int
    {
        return crc32($s);
    }
}
