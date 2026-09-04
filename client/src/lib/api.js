// ===== API FACADE =====
// Pages import from './lib/api' — never from mockDb/http directly.
// With API.USE_MOCK=true (default) every call hits the in-browser mock store.
// Flip it to false and the exact same calls go to Laravel:
//
//   GET    /api/products                 products.list({category, q, sort})
//   GET    /api/products/{id}            products.get(id)
//   POST   /api/products                 products.create(payload)      [admin]
//   PUT    /api/products/{id}            products.update(id, payload) [admin]
//   DELETE /api/products/{id}            products.remove(id)          [admin]
//   POST   /api/inventory/{id}/adjust    inventory.adjust(id, delta, reason) [admin]
//   GET    /api/categories               categories.list()
//   GET    /api/orders                   orders.list({status})         [admin]
//   GET    /api/orders/{ref}             orders.get(ref)
//   PATCH  /api/orders/{ref}/status      orders.setStatus(ref, status)[admin]
//   POST   /api/orders                   checkout.place({...})         (mock: returns order; live: payment first)
//   GET    /api/customers                customers.list({q})          [admin]
//   GET    /api/stats/overview           stats.overview()             [admin]
//   POST   /api/auth/login               auth.login({email, password})
//
// Live checkout: POST /api/checkout returns { checkout_url } (Stripe) or
// { approval_url } (PayPal); the browser redirects there and the provider
// sends the buyer back to /order/:ref after the webhook confirms payment.

import { API } from './settings'
import { mockDb } from './mockDb'
import { http, unwrap } from './http'

const live = () => API.USE_MOCK === false

export const api = {
  products: {
    list: (params = {}) =>
      live()
        ? http.get('/products', { params }).then(unwrap)
        : mockDb.listProducts(params),
    get: (id) => (live() ? http.get(`/products/${id}`).then(unwrap) : mockDb.getProduct(id)),
    create: (payload) => (live() ? http.post('/products', payload).then(unwrap) : mockDb.saveProduct(payload)),
    update: (id, payload) => (live() ? http.put(`/products/${id}`, payload).then(unwrap) : mockDb.saveProduct(payload, id)),
    remove: (id) => (live() ? http.delete(`/products/${id}`) : mockDb.deleteProduct(id)),
  },

  inventory: {
    adjust: (id, delta, reason) =>
      live() ? http.post(`/inventory/${id}/adjust`, { delta, reason }).then(unwrap) : mockDb.adjustStock(id, delta, reason),
  },

  categories: {
    list: () => (live() ? http.get('/categories').then(unwrap) : mockDb.listCategories()),
  },

  orders: {
    list: (params = {}) => (live() ? http.get('/orders', { params }).then(unwrap) : mockDb.listOrders(params)),
    get: (ref) => (live() ? http.get(`/orders/${ref}`).then(unwrap) : mockDb.getOrder(ref)),
    setStatus: (ref, status, note) =>
      live() ? http.patch(`/orders/${ref}/status`, { status, note }).then(unwrap) : mockDb.updateOrderStatus(ref, status, note),
  },

  checkout: {
    // Mock: returns the placed order. Live: returns a hosted payment URL —
    // { checkout_url } for Stripe, { approval_url } for PayPal.
    place: ({ items, customer, card, method = 'stripe', paypalEmail }) =>
      live()
        ? http.post('/checkout', { items, customer, card, payment_method: method, paypal_email: paypalEmail }).then(unwrap)
        : mockDb.placeOrder({ items, customer, card, method, paypalEmail }),
  },

  customers: {
    list: (params = {}) => (live() ? http.get('/customers', { params }).then(unwrap) : mockDb.listCustomers(params)),
  },

  stats: {
    overview: () => (live() ? http.get('/stats/overview').then(unwrap) : mockDb.overview()),
  },

  auth: {
    login: ({ email, password }) =>
      live() ? http.post('/auth/login', { email, password }).then(unwrap) : mockDb.login({ email, password }),
  },
}

export { resetDb } from './mockDb'
