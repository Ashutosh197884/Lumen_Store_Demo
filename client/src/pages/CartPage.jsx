import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { EmptyState, GradientTile, Price, QtyStepper } from '../components/ui'
import { money } from '../lib/format'
import { STORE } from '../lib/settings'

export default function CartPage() {
  const { items, setQty, remove, subtotal, shipping, total } = useCart()

  if (items.length === 0) {
    return (
      <div className="animate-scale-in mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={<ShoppingBag className="size-12" />}
          title="Your cart is empty"
          body="Good things are waiting in the catalogue — audio, home and everyday essentials."
          action={<Link to="/shop" className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700">Browse products</Link>}
        />
      </div>
    )
  }

  const progress = Math.min(100, (subtotal / STORE.FREE_SHIPPING_OVER) * 100)
  const remaining = STORE.FREE_SHIPPING_OVER - subtotal

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-stone-900">Your cart</h1>
      <p className="mt-1 text-stone-500">{items.length} product{items.length === 1 ? '' : 's'} · <Link to="/shop" className="font-semibold text-brand-600 hover:underline">continue shopping</Link></p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Lines */}
        <div className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
          {items.map((it, i) => (
            <div key={it.productId} className="animate-fade-in-up flex gap-4 p-4 sm:p-5" style={{ animationDelay: `${Math.min(i, 5) * 45}ms` }}>
              <Link to={`/product/${it.productId}`} className="shrink-0">
                <GradientTile product={it} className="size-20 rounded-xl sm:size-24" tileClassName="text-4xl" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/product/${it.productId}`} className="font-display text-sm font-bold text-stone-900 hover:text-brand-700 sm:text-base">{it.name}</Link>
                    <p className="mt-0.5 text-xs text-stone-400">{money(it.price)} each</p>
                  </div>
                  <button type="button" onClick={() => remove(it.productId)} className="grid size-8 shrink-0 place-items-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${it.name}`}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <QtyStepper value={it.qty} onChange={(v) => setQty(it.productId, v)} max={Math.max(it.qty, it.stock)} />
                  <Price amount={it.price * it.qty} size="md" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-card lg:sticky lg:top-24">
          {shipping > 0 ? (
            <div className="mb-5 rounded-xl bg-brand-50 p-3.5">
              <p className="flex items-center gap-2 text-xs font-bold text-brand-800">
                <Truck className="size-4" /> Add {money(remaining)} more for free shipping
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100">
                <div className="animate-grow-width h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="mb-5 rounded-xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-700">
              🎉 You've unlocked free shipping
            </div>
          )}

          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between text-stone-600"><dt>Subtotal</dt><dd className="font-semibold text-stone-900 tabular-nums">{money(subtotal)}</dd></div>
            <div className="flex justify-between text-stone-600"><dt>Shipping</dt><dd className="font-semibold text-stone-900 tabular-nums">{shipping === 0 ? <span className="text-emerald-600">Free</span> : money(shipping)}</dd></div>
            <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold text-stone-900"><dt>Total</dt><dd className="tabular-nums">{money(total)}</dd></div>
          </dl>

          <Link to="/checkout" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700">
            Proceed to checkout <ArrowRight className="size-4" />
          </Link>
          <p className="mt-3 text-center text-xs text-stone-400">Secure checkout · Stripe card 4242 4242 4242 4242 or PayPal</p>
        </aside>
      </div>
    </div>
  )
}
