import { daysAgo } from '../lib/format'

// ===== DEMO ORDER HISTORY =====
// Mirrors the Laravel `orders` + `order_items` tables. Events power the
// customer-facing tracking timeline and the admin status history.

export const seedCustomers = [
  { id: 'cus_1', name: 'Sara Mitchell', email: 'sara.m@example.com', phone: '+1 415 555 0123', city: 'San Francisco, CA', orders: 1, totalSpent: 208, lastOrderAt: daysAgo(12) },
  { id: 'cus_2', name: 'Omar Hassan', email: 'omar.h@example.com', phone: '+20 100 555 0144', city: 'Cairo, Egypt', orders: 1, totalSpent: 183, lastOrderAt: daysAgo(9) },
  { id: 'cus_3', name: 'Priya Nair', email: 'priya.n@example.com', phone: '+91 98 5555 0123', city: 'Bengaluru, India', orders: 1, totalSpent: 99.99, lastOrderAt: daysAgo(4) },
  { id: 'cus_4', name: 'Elena Rossi', email: 'elena.r@example.com', phone: '+39 02 555 0111', city: 'Milan, Italy', orders: 1, totalSpent: 199, lastOrderAt: daysAgo(2) },
  { id: 'cus_5', name: 'Jonas Weber', email: 'jonas.w@example.com', phone: '+49 30 555 0129', city: 'Berlin, Germany', orders: 1, totalSpent: 189, lastOrderAt: daysAgo(1) },
  { id: 'cus_6', name: 'Marcus Cole', email: 'marcus.c@example.com', phone: '+44 20 555 0188', city: 'London, UK', orders: 1, totalSpent: 50.99, lastOrderAt: daysAgo(3) },
  { id: 'cus_7', name: 'Aya Kamel', email: 'aya.k@example.com', phone: '+20 111 555 0177', city: 'Alexandria, Egypt', orders: 0, totalSpent: 0, lastOrderAt: null },
]

const ev = (status, at, note) => ({ status, at, note })

export const seedOrders = [
  {
    ref: 'LM-8402',
    createdAt: daysAgo(12),
    status: 'delivered',
    items: [
      { productId: 'wireless-headphones', name: 'Wireless Headphones', qty: 1, unitPrice: 129, emoji: '🎧' },
      { productId: 'true-wireless-earbuds', name: 'True Wireless Earbuds', qty: 1, unitPrice: 79, emoji: '🎵' },
    ],
    subtotal: 208,
    shipping: 0,
    total: 208,
    customer: { name: 'Sara Mitchell', email: 'sara.m@example.com', phone: '+1 415 555 0123', address: '482 Market St, Apt 9', city: 'San Francisco, CA', country: 'US' },
    payment: { method: 'stripe', status: 'paid', brand: 'Visa', last4: '4242' },
    events: [
      ev('created', daysAgo(12), 'Order received'),
      ev('paid', daysAgo(12), 'Payment captured (Visa •••• 4242)'),
      ev('processing', daysAgo(11), 'Packed by the fulfilment team'),
      ev('shipped', daysAgo(10), 'Handed to carrier — tracking LUM123456789'),
      ev('delivered', daysAgo(9), 'Delivered — signed by S. Mitchell'),
    ],
  },
  {
    ref: 'LM-8403',
    createdAt: daysAgo(9),
    status: 'delivered',
    items: [
      { productId: 'coffee-maker', name: 'Pour-over Coffee Maker', qty: 1, unitPrice: 149, emoji: '☕' },
      { productId: 'woven-storage-basket', name: 'Woven Storage Basket', qty: 1, unitPrice: 34, emoji: '🧺' },
    ],
    subtotal: 183,
    shipping: 0,
    total: 183,
    customer: { name: 'Omar Hassan', email: 'omar.h@example.com', phone: '+20 100 555 0144', address: '14 Talaat Harb St', city: 'Cairo, Egypt', country: 'EG' },
    payment: { method: 'stripe', status: 'paid', brand: 'Mastercard', last4: '5555' },
    events: [
      ev('created', daysAgo(9), 'Order received'),
      ev('paid', daysAgo(9), 'Payment captured (Mastercard •••• 5555)'),
      ev('processing', daysAgo(8), 'Packed by the fulfilment team'),
      ev('shipped', daysAgo(7), 'Handed to carrier — tracking LUM123456812'),
      ev('delivered', daysAgo(6), 'Delivered — left with concierge'),
    ],
  },
  {
    ref: 'LM-8404',
    createdAt: daysAgo(4),
    status: 'shipped',
    items: [
      { productId: 'cast-iron-pan', name: 'Cast Iron Pan', qty: 1, unitPrice: 59, emoji: '🍳' },
      { productId: 'insulated-tumbler', name: 'Insulated Tumbler', qty: 1, unitPrice: 35, emoji: '🥤' },
    ],
    subtotal: 94,
    shipping: 5.99,
    total: 99.99,
    customer: { name: 'Priya Nair', email: 'priya.n@example.com', phone: '+91 98 5555 0123', address: '21 MG Road, Indiranagar', city: 'Bengaluru, India', country: 'IN' },
    payment: { method: 'stripe', status: 'paid', brand: 'Visa', last4: '4242' },
    events: [
      ev('created', daysAgo(4), 'Order received'),
      ev('paid', daysAgo(4), 'Payment captured (Visa •••• 4242)'),
      ev('processing', daysAgo(3), 'Packed by the fulfilment team'),
      ev('shipped', daysAgo(1), 'Handed to carrier — tracking LUM123456899'),
    ],
  },
  {
    ref: 'LM-8405',
    createdAt: daysAgo(2),
    status: 'processing',
    items: [{ productId: 'smart-watch', name: 'Smart Watch', qty: 1, unitPrice: 199, emoji: '⌚' }],
    subtotal: 199,
    shipping: 0,
    total: 199,
    customer: { name: 'Elena Rossi', email: 'elena.r@example.com', phone: '+39 02 555 0111', address: 'Via Brera 8', city: 'Milan, Italy', country: 'IT' },
    payment: { method: 'stripe', status: 'paid', brand: 'Visa', last4: '4242' },
    events: [
      ev('created', daysAgo(2), 'Order received'),
      ev('paid', daysAgo(2), 'Payment captured (Visa •••• 4242)'),
      ev('processing', daysAgo(2), 'Packed by the fulfilment team'),
    ],
  },
  {
    ref: 'LM-8406',
    createdAt: daysAgo(1),
    status: 'paid',
    items: [{ productId: 'portable-speaker', name: 'Portable Speaker', qty: 1, unitPrice: 189, emoji: '🔊' }],
    subtotal: 189,
    shipping: 0,
    total: 189,
    customer: { name: 'Jonas Weber', email: 'jonas.w@example.com', phone: '+49 30 555 0129', address: 'Kastanienallee 32', city: 'Berlin, Germany', country: 'DE' },
    payment: { method: 'stripe', status: 'paid', brand: 'Mastercard', last4: '5555' },
    events: [
      ev('created', daysAgo(1), 'Order received'),
      ev('paid', daysAgo(1), 'Payment captured (Mastercard •••• 5555)'),
    ],
  },
  {
    ref: 'LM-8407',
    createdAt: daysAgo(3),
    status: 'cancelled',
    items: [{ productId: 'polarized-sunglasses', name: 'Polarized Sunglasses', qty: 1, unitPrice: 45, emoji: '🕶️' }],
    subtotal: 45,
    shipping: 5.99,
    total: 50.99,
    customer: { name: 'Marcus Cole', email: 'marcus.c@example.com', phone: '+44 20 555 0188', address: '11 King\'s Road', city: 'London, UK', country: 'GB' },
    payment: { method: 'stripe', status: 'refunded', brand: 'Visa', last4: '4000' },
    events: [
      ev('created', daysAgo(3), 'Order received'),
      ev('paid', daysAgo(3), 'Payment captured (Visa •••• 4000)'),
      ev('cancelled', daysAgo(2), 'Cancelled by customer — refund issued'),
    ],
  },
]
