/* Tiny pub/sub toast store — no dependencies. <ToastHost /> (in ui.jsx) subscribes. */
let nextId = 0
const listeners = new Set()

export function toast(message, opts = {}) {
  const t = { id: ++nextId, message, tone: opts.tone || 'success' }
  listeners.forEach((fn) => fn(t))
}

export function subscribeToast(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}