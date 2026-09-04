// Canonical order lifecycle shared by storefront and admin.
// 'created' exists on the server; the client treats it as a pre-payment state.

export const ORDER_FLOW = ['created', 'paid', 'processing', 'shipped', 'delivered']

export const ORDER_STATUS = {
  created:    { label: 'Created',    tone: 'gray',   desc: 'Order received, payment pending' },
  paid:       { label: 'Paid',       tone: 'blue',   desc: 'Payment confirmed' },
  processing: { label: 'Processing', tone: 'indigo', desc: 'Being packed for dispatch' },
  shipped:    { label: 'Shipped',    tone: 'violet', desc: 'In transit to the customer' },
  delivered:  { label: 'Delivered',  tone: 'green',  desc: 'Reached the customer' },
  cancelled:  { label: 'Cancelled',  tone: 'red',    desc: 'Cancelled — refund issued if paid' },
}

export const STATUS_ORDER = ['created', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

export const nextStatuses = (current) => {
  if (current === 'cancelled' || current === 'delivered') return []
  if (current === 'created') return ['cancelled', 'paid']
  const i = STATUS_ORDER.indexOf(current)
  return [STATUS_ORDER[i + 1], 'cancelled']
}

export const isBefore = (a, b) => ORDER_FLOW.indexOf(a) < ORDER_FLOW.indexOf(b)
