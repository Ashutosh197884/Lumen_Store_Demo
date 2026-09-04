// ===== MOCK BACKEND (localStorage) =====
// Emulates the Laravel REST API so the whole product works with zero backend.
// Business rules live HERE exactly as they will on the server:
//   • totals are recomputed from stored prices (never trust the client)
//   • stock is validated + decremented atomically-ish per order
//   • Stripe test-card simulation (4242 = success, 4000 = decline)
// Swap to the real API by flipping API.USE_MOCK in src/lib/settings.js.

import { seedProducts, CATEGORY_MAP } from '../data/seedProducts'
import { seedOrders, seedCustomers } from '../data/seedOrders'
import { STORE } from './settings'
import { daysAgo } from './format'

const KEY = 'lumen.db.v1'

export class ApiError extends Error {
  constructor(message, code = 'error', details = null) {
    super(message)
    this.code = code
    this.details = details
  }
}

const clone = (x) => JSON.parse(JSON.stringify(x))

const lat = (ms = 120 + Math.random() * 140) => new Promise((r) => setTimeout(r, ms))

let cached = null

function load() {
  if (cached) return cached
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      cached = JSON.parse(raw)
      if (cached.version === 1) return cached
    }
  } catch {
    /* corrupted storage → reseed */
  }
  cached = {
    version: 1,
    products: clone(seedProducts),
    orders: clone(seedOrders),
    customers: clone(seedCustomers),
    inventoryLog: [],
    orderSeq: 8408,
  }
  save()
  return cached
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(cached))
}

export function resetDb() {
  cached = null
  localStorage.removeItem(KEY)
  load()
}

export const mockDb = {
  async listProducts({ category, q, sort, includeInactive } = {}) {
    await lat(80)
    let rows = load().products
    if (!includeInactive) rows = rows.filter((p) => p.active)
    if (category && category !== 'all') rows = rows.filter((p) => p.category === category)
    if (q) {
      const s = q.toLowerCase()
      rows = rows.filter(
        (p) => p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)
      )
    }
    if (sort === 'price-asc') rows = [...rows].sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') rows = [...rows].sort((a, b) => b.price - a.price)
    else if (sort === 'rating') rows = [...rows].sort((a, b) => b.rating - a.rating)
    else if (sort === 'newest') rows = [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    else rows = [...rows].sort((a, b) => (b.featured - a.featured) || (b.stock > 0) - (a.stock > 0))
    return clone(rows)
  },

  async getProduct(id) {
    await lat(60)
    const p = load().products.find((x) => x.id === id)
    if (!p) throw new ApiError('Product not found', 'not_found')
    return clone(p)
  },

  async saveProduct(payload, id) {
    await lat(160)
    const db = load()
    const clean = {
      name: payload.name?.trim(),
      category: payload.category,
      price: Math.max(0, Number(payload.price) || 0),
      compareAt: payload.compareAt ? Math.max(0, Number(payload.compareAt) || 0) : null,
      stock: Math.max(0, Number(payload.stock) || 0),
      unit: payload.unit || 'each',
      emoji: payload.emoji || '📦',
      description: payload.description?.trim() || '',
      features: (payload.features || []).filter(Boolean),
      badges: (payload.badges || []).filter(Boolean),
      active: payload.active !== false,
      rating: payload.rating ?? 4.5,
      reviews: payload.reviews ?? 0,
    }
    if (!clean.name) throw new ApiError('Product name is required', 'validation')
    if (!CATEGORY_MAP[clean.category]) throw new ApiError('Invalid category', 'validation')

    if (id) {
      const i = db.products.findIndex((p) => p.id === id)
      if (i < 0) throw new ApiError('Product not found', 'not_found')
      db.products[i] = {
        ...db.products[i],
        ...clean,
        sku: payload.sku?.trim() || db.products[i].sku,
        updatedAt: new Date().toISOString(),
      }
      return clone(db.products[i])
    }
    const newP = {
      ...clean,
      id: uid('prd'),
      sku: payload.sku?.trim() || genSku(db),
      featured: false,
      createdAt: new Date().toISOString(),
    }
    db.products.push(newP)
    save()
    return clone(newP)
  },

  async deleteProduct(id) {
    await lat(140)
    const db = load()
    const i = db.products.findIndex((p) => p.id === id)
    if (i < 0) throw new ApiError('Product not found', 'not_found')
    db.products.splice(i, 1)
    save()
  },

  async adjustStock(id, delta, reason = 'manual') {
    await lat(120)
    const db = load()
    const p = db.products.find((x) => x.id === id)
    if (!p) throw new ApiError('Product not found', 'not_found')
    const next = p.stock + delta
    if (next < 0) throw new ApiError('Not enough stock on hand', 'insufficient_stock')
    p.stock = next
    p.updatedAt = new Date().toISOString()
    db.inventoryLog.unshift({ id: uid('log'), productId: id, delta, reason, at: new Date().toISOString() })
    save()
    return clone(p)
  },

  async listCategories() {
    await lat(30)
    return Object.values(CATEGORY_MAP).map((c) => ({ ...c }))
  },

  async listOrders({ status } = {}) {
    await lat(100)
    let rows = load().orders
    if (status && status !== 'all') rows = rows.filter((o) => o.status === status)
    return clone([...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
  },

  async getOrder(ref) {
    await lat(70)
    const o = load().orders.find((x) => x.ref.toLowerCase() === String(ref).toLowerCase())
    if (!o) throw new ApiError('Order not found', 'not_found')
    return clone(o)
  },

  async updateOrderStatus(ref, status, note) {
    await lat(130)
    const db = load()
    const o = db.orders.find((x) => x.ref.toLowerCase() === String(ref).toLowerCase())
    if (!o) throw new ApiError('Order not found', 'not_found')
    o.status = status
    o.events = o.events || []
    o.events.push({
      status,
      at: new Date().toISOString(),
      note: note || (status === 'cancelled' ? 'Cancelled by admin' : 'Status updated'),
    })
    if (status === 'cancelled') o.payment.status = 'refunded'
    save()
    return clone(o)
  },

  // --- checkout + order placement ---------------------------------------------

  async placeOrder({ items, customer, card, method = 'stripe', paypalEmail }) {
    await lat(500)
    const db = load()

    if (!items?.length) throw new ApiError('Your cart is empty', 'empty_cart')

    if (method === 'paypal') {
      const email = (paypalEmail || '').trim()
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new ApiError('Enter the PayPal email you want to pay with', 'validation')
      }
      if (email.toLowerCase().includes('decline')) {
        throw new ApiError('This sandbox buyer was declined by PayPal. Try buyer@demo.test.', 'payment_declined')
      }
    } else {
      const digits = (card || '').replace(/\D/g, '')
      if (digits.startsWith('4000')) {
        throw new ApiError('Your test card was declined by the issuer. Try 4242 4242 4242 4242.', 'card_declined')
      }
      if (!digits.startsWith('4242')) {
        throw new ApiError('Use Stripe test card 4242 4242 4242 4242 to complete this demo purchase.', 'invalid_card')
      }
    }
    if (!customer?.email?.includes('@')) throw new ApiError('A valid email is required', 'validation')

    // Recompute everything server-side from stored prices
    const lines = []
    for (const it of items) {
      const p = db.products.find((x) => x.id === it.productId)
      if (!p || !p.active) throw new ApiError('A product in your cart is no longer available', 'unavailable')
      const qty = Math.max(1, Math.floor(Number(it.qty) || 1))
      if (p.stock < qty) throw new ApiError(`Only ${p.stock} left of "${p.name}"`, 'insufficient_stock')
      lines.push({ productId: p.id, name: p.name, qty, unitPrice: p.price, emoji: p.emoji })
    }
    const subtotal = round2(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0))
    const shipping = subtotal >= STORE.FREE_SHIPPING_OVER ? 0 : STORE.SHIPPING_FLAT
    const total = round2(subtotal + shipping)

    const ref = `LM-${db.orderSeq++}`
    const paypal = method === 'paypal'
    const payment = paypal
      ? {
          method: 'paypal',
          provider: 'paypal',
          status: 'paid',
          email: (paypalEmail || '').trim(),
          brand: null,
          last4: null,
        }
      : {
          method: 'stripe',
          provider: 'stripe',
          status: 'paid',
          brand: 'Visa',
          last4: '4242',
        }
    const order = {
      ref,
      createdAt: new Date().toISOString(),
      status: 'paid',
      items: lines,
      subtotal,
      shipping,
      total,
      customer: { name: customer.name?.trim(), email: customer.email?.trim(), phone: customer.phone?.trim(), address: customer.address?.trim(), city: customer.city?.trim(), country: customer.country?.trim() },
      payment,
      events: [
        { status: 'created', at: new Date().toISOString(), note: 'Order received' },
        {
          status: 'paid',
          at: new Date().toISOString(),
          note: paypal
            ? `Payment captured via PayPal (${payment.email}) — sandbox`
            : 'Payment captured (Visa •••• 4242) — Stripe test mode',
        },
      ],
    }
    db.orders.unshift(order)

    // Decrement stock + record movements
    for (const l of lines) {
      const p = db.products.find((x) => x.id === l.productId)
      p.stock -= l.qty
      p.updatedAt = new Date().toISOString()
      db.inventoryLog.unshift({ id: uid('log'), productId: l.productId, delta: -l.qty, reason: `order ${ref}`, at: order.createdAt })
    }

    // Upsert customer record
    let c = db.customers.find((x) => x.email.toLowerCase() === order.customer.email.toLowerCase())
    if (c) {
      c.name = order.customer.name
      c.orders += 1
      c.totalSpent = round2(c.totalSpent + total)
      c.lastOrderAt = order.createdAt
    } else {
      db.customers.push({
        id: uid('cus'),
        name: order.customer.name || order.customer.email,
        email: order.customer.email,
        phone: order.customer.phone || '',
        city: [order.customer.city, order.customer.country].filter(Boolean).join(', ') || '—',
        orders: 1,
        totalSpent: total,
        lastOrderAt: order.createdAt,
      })
    }
    save()
    return clone(order)
  },

  async listCustomers({ q } = {}) {
    await lat(90)
    let rows = load().customers
    if (q) {
      const s = q.toLowerCase()
      rows = rows.filter((c) => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s))
    }
    return clone([...rows].sort((a, b) => (b.lastOrderAt || '') > (a.lastOrderAt || '') ? 1 : -1))
  },

  async overview() {
    await lat(120)
    const db = load()
    const active = db.products.filter((p) => p.active)
    const revenue = round2(db.orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0))
    const last7 = db.orders.filter((o) => new Date(o.createdAt) > new Date(Date.now() - 7 * 864e5))
    const pending = db.orders.filter((o) => o.status === 'paid' || o.status === 'processing')
    const lowStock = active.filter((p) => p.stock <= STORE.LOW_STOCK_THRESHOLD)
    const byDay = []
    for (let d = 6; d >= 0; d--) {
      const day = daysAgo(d).slice(0, 10)
      byDay.push({
        day: day.slice(5),
        orders: db.orders.filter((o) => o.createdAt.slice(0, 10) === day).length,
        revenue: round2(db.orders.filter((o) => o.createdAt.slice(0, 10) === day && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)),
      })
    }
    return {
      stats: {
        revenue,
        orders: db.orders.length,
        customers: db.customers.length,
        products: active.length,
        lowStock: lowStock.length,
        outOfStock: active.filter((p) => p.stock === 0).length,
        last7Orders: last7.length,
        pendingOrders: pending.length,
      },
      lowStock,
      recentOrders: clone(db.orders.slice(0, 6)),
      byDay,
    }
  },

  async login({ email, password }) {
    await lat(350)
    const okEmail = email?.toLowerCase() === 'admin@lumen.test'
    const okPass = password === 'demo'
    if (okEmail && okPass) {
      return { user: { id: 'admin_1', name: 'Store Admin', email: 'admin@lumen.test', role: 'admin' }, token: 'mock-token' }
    }
    throw new ApiError(
      'Invalid credentials. Demo login: admin@lumen.test / demo',
      'invalid_credentials'
    )
  },
}

const round2 = (n) => Math.round(n * 100) / 100
const genSku = (db) => {
  const n = 5000 + db.products.length + Math.floor(Math.random() * 900)
  return `LM-${n}`
}
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
