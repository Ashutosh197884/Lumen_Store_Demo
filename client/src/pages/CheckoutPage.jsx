import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Lock, ShieldCheck, ShoppingBag, Wallet } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { api } from '../lib/api'
import { Button, EmptyState, Field, GradientTile, Input, Select } from '../components/ui'
import { money } from '../lib/format'
import { API } from '../lib/settings'
import { cx } from '../lib/cx'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const PAYPAL_BLUE = '#0070BA'

export default function CheckoutPage() {
  const { items, subtotal, shipping, total, clear } = useCart()
  const navigate = useNavigate()
  const [method, setMethod] = useState('stripe') // 'stripe' | 'paypal'
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', country: 'US',
    card: API.TEST_CARD, expiry: '12 / 28', cvc: '123',
  })
  const [paypalEmail, setPaypalEmail] = useState(API.TEST_PAYPAL_EMAIL)
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)
  const [payStage, setPayStage] = useState(null) // null | 'redirect' | 'approve' (PayPal mock)
  const [apiError, setApiError] = useState(null)

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={<ShoppingBag className="size-12" />}
          title="Nothing to check out"
          body="Your cart is empty — add a product first."
          action={<Link to="/shop" className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white">Go shopping</Link>}
        />
      </div>
    )
  }

  const isPaypal = method === 'paypal'
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'A valid email is required'
    if (!form.address.trim()) e.address = 'Street address is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (isPaypal) {
      if (!/^\S+@\S+\.\S+$/.test(paypalEmail)) e.paypalEmail = 'Enter the PayPal email for this payment'
    } else {
      const digits = form.card.replace(/\D/g, '')
      if (digits.length < 12) e.card = 'Card number looks incomplete'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const placeOrder = async () => {
    if (!validate()) return
    setApiError(null)
    setPlacing(true)
    try {
      // PayPal mock: simulate the redirect to PayPal, then the buyer approving.
      if (isPaypal && API.USE_MOCK) {
        setPayStage('redirect')
        await wait(1000)
        setPayStage('approve')
        await wait(1000)
      }
      const res = await api.checkout.place({
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        customer: { name: form.name, email: form.email, phone: form.phone, address: form.address, city: form.city, country: form.country },
        card: form.card,
        method,
        paypalEmail,
      })
      // Live mode: server returns a hosted payment URL — Stripe Checkout or PayPal approval page.
      if (res.checkout_url || res.approval_url) {
        window.location.href = res.checkout_url || res.approval_url
        return
      }
      const order = res
      clear()
      navigate(`/order/${order.ref}`, { state: { justPaid: true } })
    } catch (err) {
      setApiError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setPlacing(false)
      setPayStage(null)
    }
  }

  const payLabel = () => {
    if (!placing) return isPaypal ? 'Continue to PayPal' : `Pay ${money(total)} securely`
    if (isPaypal && payStage === 'redirect') return 'Redirecting to PayPal…'
    if (isPaypal && payStage === 'approve') return 'Approving payment with PayPal…'
    return 'Processing payment…'
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-stone-900">Checkout</h1>
      <p className="mt-1 text-stone-500">One step away — pay by card (Stripe test mode) or with a PayPal sandbox account.</p>

      {apiError && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 animate-fade-in">{apiError}</div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Contact */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-bold text-stone-900">1 · Contact details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name}><Input value={form.name} onChange={set('name')} placeholder="Sara Mitchell" autoComplete="name" /></Field>
              <Field label="Email" hint="Order confirmation and tracking go here" error={errors.email}><Input type="email" value={form.email} onChange={set('email')} placeholder="sara@example.com" autoComplete="email" /></Field>
            </div>
          </section>

          {/* Shipping */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-bold text-stone-900">2 · Shipping address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Phone (optional)" error={errors.phone}><Input value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" autoComplete="tel" /></Field>
              <Field label="Country" error={errors.country}><Select value={form.country} onChange={set('country')}>{['US', 'EG', 'UK', 'IN', 'DE', 'IT', 'FR', 'AE', 'CA', 'AU'].map((c) => <option key={c}>{c}</option>)}</Select></Field>
              <Field label="Street address" error={errors.address} className="sm:col-span-2"><Input value={form.address} onChange={set('address')} placeholder="482 Market St, Apt 9" autoComplete="street-address" /></Field>
              <Field label="City" error={errors.city}><Input value={form.city} onChange={set('city')} placeholder="San Francisco" autoComplete="address-level2" /></Field>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-stone-900">3 · Payment</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                <Lock className="size-3" />
                {isPaypal ? 'PayPal sandbox' : 'Stripe test mode'}
              </span>
            </div>

            {/* Method selector */}
            <div className="mt-4 grid grid-cols-2 gap-3" role="tablist" aria-label="Payment method">
              <button
                type="button"
                role="tab"
                aria-selected={!isPaypal}
                onClick={() => setMethod('stripe')}
                className={cx(
                  'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                  !isPaypal ? 'border-brand-600 bg-brand-50/60' : 'border-stone-200 bg-white hover:border-stone-300'
                )}
              >
                <div className={cx('grid size-9 shrink-0 place-items-center rounded-lg', !isPaypal ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-500')}>
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">Card</p>
                  <p className="text-xs text-stone-500">Visa, Mastercard, Amex — via Stripe</p>
                </div>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isPaypal}
                onClick={() => setMethod('paypal')}
                className={cx(
                  'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                  isPaypal ? 'border-[#0070BA] bg-[#0070BA]/5' : 'border-stone-200 bg-white hover:border-stone-300'
                )}
              >
                <div className={cx('grid size-9 shrink-0 place-items-center rounded-lg', isPaypal ? 'bg-[#0070BA] text-white' : 'bg-stone-100 text-stone-500')}>
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">PayPal</p>
                  <p className="text-xs text-stone-500">Pay from your PayPal balance or bank</p>
                </div>
              </button>
            </div>

            {/* Card fields */}
            {!isPaypal ? (
              <div className="mt-4 rounded-xl border-2 border-brand-300 bg-brand-50/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-lg bg-brand-600 text-white"><CreditCard className="size-5" /></div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">Card — Visa •••• 4242</p>
                    <p className="text-xs text-stone-500">Simulated Stripe Checkout. Use test card <b className="font-mono">4242 4242 4242 4242</b>; 4000… declines.</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Card number" error={errors.card} className="sm:col-span-2"><Input value={form.card} onChange={set('card')} placeholder={API.TEST_CARD} inputMode="numeric" /></Field>
                  <Field label="Expiry"><Input value={form.expiry} onChange={set('expiry')} placeholder="MM / YY" /></Field>
                  <Field label="CVC"><Input value={form.cvc} onChange={set('cvc')} placeholder="123" inputMode="numeric" /></Field>
                </div>
              </div>
            ) : (
              /* PayPal panel */
              <div className="mt-4 rounded-xl border-2 border-[#0070BA]/40 bg-[#0070BA]/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-lg bg-[#0070BA] text-sm font-black text-white">P</div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">PayPal sandbox</p>
                    <p className="text-xs text-stone-500">You'll be redirected to PayPal to review and approve this payment. Nothing is charged until you approve it.</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Field label="PayPal email" hint="The sandbox buyer that approves this payment" error={errors.paypalEmail}>
                    <Input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} placeholder={API.TEST_PAYPAL_EMAIL} autoComplete="email" />
                  </Field>
                </div>
                <p className="mt-3 flex items-center gap-2 text-xs text-stone-400"><ShieldCheck className="size-4 text-[#0070BA]" /> Demo uses PayPal sandbox — use <b className="font-mono">buyer@demo.test</b>; an email containing “decline” simulates a rejected buyer.</p>
              </div>
            )}
            <p className="mt-3 flex items-center gap-2 text-xs text-stone-400"><ShieldCheck className="size-4 text-emerald-600" /> Card details are handled by Stripe in production; PayPal handles its own credentials. Lumen never stores them.</p>
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-card lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-stone-900">Order summary</h2>
          <ul className="mt-4 max-h-72 space-y-3 overflow-auto pr-1">
            {items.map((it) => (
              <li key={it.productId} className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <GradientTile product={it} className="size-12 rounded-lg" tileClassName="text-2xl" />
                  <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-stone-900 text-[10px] font-bold text-white">{it.qty}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-800">{it.name}</p>
                  <p className="text-xs text-stone-400">{money(it.price)} each</p>
                </div>
                <span className="text-sm font-bold text-stone-900 tabular-nums">{money(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm">
            <div className="flex justify-between text-stone-600"><dt>Subtotal</dt><dd className="font-semibold tabular-nums">{money(subtotal)}</dd></div>
            <div className="flex justify-between text-stone-600">
              <dt>Shipping</dt>
              <dd className="font-semibold tabular-nums">{shipping === 0 ? <span className="text-emerald-600">Free</span> : money(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold text-stone-900">
              <dt>Total</dt>
              <dd className="tabular-nums">{money(total)}</dd>
            </div>
          </dl>

          <Button
            onClick={placeOrder}
            loading={placing}
            className="mt-6 w-full py-3.5"
            style={isPaypal && !placing ? { backgroundColor: PAYPAL_BLUE } : undefined}
          >
            {payLabel()}
          </Button>
          <p className="mt-3 text-center text-xs text-stone-400">By placing this order you agree to the demo terms.</p>
        </aside>
      </div>
    </div>
  )
}