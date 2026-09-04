import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { STORE } from '../lib/settings'
import { toast } from '../lib/toast'

const CartContext = createContext(null)
const KEY = 'lumen.cart.v1'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  const add = (product, qty = 1) => {
    toast(`Added ${product.name} to cart`)
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, qty: Math.min(product.stock, i.qty + qty) } : i
        )
      }
      return [...prev, { productId: product.id, name: product.name, emoji: product.emoji, category: product.category, price: product.price, qty, stock: product.stock }]
    })
  }

  const setQty = (productId, qty) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, qty } : i))
    )

  const remove = (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId))
  const clear = () => setItems([])

  const subtotal = useMemo(() => round2(items.reduce((s, i) => s + i.price * i.qty, 0)), [items])
  const shipping = subtotal === 0 || subtotal >= STORE.FREE_SHIPPING_OVER ? 0 : STORE.SHIPPING_FLAT
  const total = round2(subtotal + shipping)
  const count = items.reduce((s, i) => s + i.qty, 0)

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, subtotal, shipping, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)

const round2 = (n) => Math.round(n * 100) / 100
