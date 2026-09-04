import { Link, useLocation, useParams } from 'react-router-dom'
import { CheckCircle2, CircleDashed, MapPin, PackageCheck, PackageX } from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { GradientTile, Loader, Pill, StatusPill } from '../components/ui'
import { money, fmtDate } from '../lib/format'
import { ORDER_FLOW, ORDER_STATUS } from '../lib/orderStatus'
import { cx } from '../lib/cx'

export default function OrderPage() {
  const { ref } = useParams()
  const location = useLocation()
  const justPaid = Boolean(location.state?.justPaid)

  const { data: order, loading, error } = useFetch(() => api.orders.get(ref), [ref])

  if (loading) return <Loader label={`Looking up ${ref}…`} />
  if (error || !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-500"><PackageX className="size-7" /></div>
        <h1 className="mt-4 font-display text-2xl font-bold text-stone-900">We couldn't find that order</h1>
        <p className="mt-2 text-stone-500">{error?.message || 'Check the reference and try again.'}</p>
        <Link to="/track" className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white">Try another reference</Link>
      </div>
    )
  }

  const cancelled = order.status === 'cancelled'
  const activeIdx = ORDER_FLOW.indexOf(order.status)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">Order {order.ref}</h1>
            <StatusPill status={order.status} />
          </div>
          <p className="mt-1 text-sm text-stone-500">Placed {fmtDate(order.createdAt)} · {order.items.reduce((s, i) => s + i.qty, 0)} item(s)</p>
        </div>
        <Link to="/track" className="text-sm font-bold text-brand-600 hover:underline">Track another order →</Link>
      </div>

      {justPaid && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 animate-fade-in-up">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" />
          <div>
            <p className="font-display font-bold text-emerald-900">Payment successful — your order is confirmed!</p>
            <p className="mt-1 text-sm text-emerald-800">
              A confirmation was sent to {order.customer.email}. We'll update this timeline as {order.customer.name?.split(' ')[0] || 'your'} order moves through fulfilment.
            </p>
          </div>
        </div>
      )}

      {cancelled && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
          <PackageX className="mt-0.5 size-6 shrink-0 text-red-500" />
          <div>
            <p className="font-display font-bold text-red-900">This order was cancelled</p>
            <p className="mt-1 text-sm text-red-700">{order.payment?.status === 'refunded' ? 'Payment has been refunded to the original payment method.' : 'No payment was captured.'}</p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Timeline + items */}
        <div className="space-y-6">
          {/* Timeline */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-bold text-stone-900">Order progress</h2>
            {cancelled ? (
              <p className="mt-3 text-sm text-stone-500">{ORDER_STATUS.cancelled.desc}.</p>
            ) : (
              <ol className="mt-5">
                {ORDER_FLOW.map((step, i) => {
                  const done = order.status === 'delivered' ? true : i <= activeIdx
                  const isCurrent = i === activeIdx
                  return (
                    <li key={step} className="relative flex gap-4 pb-7 last:pb-0">
                      {i < ORDER_FLOW.length - 1 && <span className={cx('absolute left-[11px] top-7 h-[calc(100%-20px)] w-0.5', done ? 'bg-emerald-400' : 'bg-stone-200')} />}
                      <span className={cx('grid size-6 shrink-0 place-items-center rounded-full border-2', done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300 bg-white text-stone-300')}>
                        {done ? <CheckCircle2 className="size-4" /> : <CircleDashed className="size-4" />}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className={cx('text-sm font-bold', done ? 'text-stone-900' : 'text-stone-400')}>{ORDER_STATUS[step].label}</p>
                        {isCurrent && <p className="text-xs text-stone-400">{ORDER_STATUS[step].desc}</p>}
                        {done && eventFor(order, step) && (
                          <p className="mt-0.5 text-xs text-stone-400">
                            {fmtDate(eventFor(order, step).at)} — {eventFor(order, step).note}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>

          {/* Items */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-bold text-stone-900">Items</h2>
            <ul className="mt-4 divide-y divide-stone-100">
              {order.items.map((it) => (
                <li key={it.productId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <GradientTile product={it} className="size-14 rounded-xl" tileClassName="text-3xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-stone-900">
                      <Link to={`/product/${it.productId}`} className="hover:text-brand-700">{it.name}</Link>
                    </p>
                    <p className="text-xs text-stone-400">Qty {it.qty} · {money(it.unitPrice)} each</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-stone-900">{money(it.unitPrice * it.qty)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-bold text-stone-900">Summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-stone-600"><dt>Subtotal</dt><dd className="font-semibold tabular-nums text-stone-900">{money(order.subtotal)}</dd></div>
              <div className="flex justify-between text-stone-600"><dt>Shipping</dt><dd className="font-semibold tabular-nums text-stone-900">{order.shipping === 0 ? 'Free' : money(order.shipping)}</dd></div>
              <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold text-stone-900"><dt>Total</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
              <div className="flex justify-between pt-1 text-xs text-stone-400">
                <dt>Payment</dt>
                <dd>{order.payment?.method === 'paypal' ? `PayPal · ${order.payment?.email}` : `${order.payment?.brand || 'Card'} •••• ${order.payment?.last4 || '4242'}`}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-stone-900"><MapPin className="size-5 text-brand-600" /> Shipping to</h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-stone-600">
              {order.customer.name}<br />
              {order.customer.address}<br />
              {order.customer.city}, {order.customer.country}<br />
              {order.customer.email}
            </address>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-bold text-stone-900">Need help?</h2>
            <p className="mt-2 text-sm text-stone-500">Questions about this order? Contact support with reference <b>{order.ref}</b>.</p>
            <Link to="/track" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline"><PackageCheck className="size-4" /> Check another order</Link>
          </section>
        </div>
      </div>
    </div>
  )
}

const eventFor = (order, step) => (order.events || []).find((e) => e.status === step)
