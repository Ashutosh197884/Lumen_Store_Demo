import { Link } from 'react-router-dom'
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { api } from '../lib/api'
import { Loader } from '../components/ui'
import ProductCard from '../components/ProductCard'
import { CATEGORIES, CATEGORY_MAP } from '../data/seedProducts'
import { GradientTile, Pill } from '../components/ui'
import { money } from '../lib/format'
import { STORE } from '../lib/settings'

export default function HomePage() {
  const { data: products, loading } = useFetch(() => api.products.list())

  if (loading || !products) return <Loader label="Opening the store…" />

  const featured = products.filter((p) => p.featured).slice(0, 4)
  const collage = products.filter((p) => p.stock > 0).slice(0, 4)
  const counts = products.reduce((m, p) => ({ ...m, [p.category]: (m[p.category] || 0) + 1 }), {})

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-white">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-brand-100/70 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 top-24 size-80 rounded-full bg-accent-100/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-in-up">
            <Pill tone="indigo" className="mb-5">New season essentials · Fresh drop weekly</Pill>
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl xl:text-6xl">
              Everyday essentials,
              <span className="text-brand-600"> thoughtfully made.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-stone-500">
              Audio, home and everyday carry — designed to last, priced fairly, delivered fast.
              Everything below runs on the same stack your store will: catalogue, cart, payments and orders.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700">
                Shop the catalogue <ArrowRight className="size-4" />
              </Link>
              <Link to="/track" className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-3.5 text-sm font-bold text-stone-800 transition hover:border-stone-400">
                <Truck className="size-4" /> Track an order
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-stone-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-emerald-600" /> Card & PayPal test payments</span>
              <span className="flex items-center gap-1.5"><RotateCcw className="size-4 text-brand-600" /> 30-day returns</span>
            </div>
          </div>

          {/* Collage */}
          <div className="grid grid-cols-2 gap-4 animate-fade-in-up delay-2">
            {collage.map((p, i) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className={`group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-card-hover ${i % 2 === 1 ? 'lg:mt-8' : ''}`}
              >
                <div className="aspect-square">
                  <GradientTile product={p} className="h-full transition group-hover:scale-[1.03] duration-500" />
                </div>
                <div className="p-3.5">
                  <p className="truncate text-sm font-bold text-stone-900">{p.name}</p>
                  <p className="mt-0.5 text-sm text-stone-500">{money(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Perks ---------- */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 md:grid-cols-3">
          {[
            { icon: <Truck className="size-5" />, title: `Free shipping over ${money(STORE.FREE_SHIPPING_OVER)}`, body: 'Flat, tracked delivery everywhere in the demo.' },
            { icon: <RotateCcw className="size-5" />, title: '30-day easy returns', body: 'Changed your mind? Send it back, no questions.' },
            { icon: <ShieldCheck className="size-5" />, title: 'Secure checkout', body: 'Stripe cards or PayPal — both in test mode.' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{f.icon}</div>
              <div>
                <h3 className="font-display text-sm font-bold text-stone-900">{f.title}</h3>
                <p className="mt-1 text-sm text-stone-500">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Browse</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">Shop by category</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700 sm:inline-flex">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/shop?category=${c.slug}`} className="group">
              <div className={`relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${c.gradient}`}>
                <span className="text-5xl drop-shadow-sm transition group-hover:scale-110" aria-hidden>{{
                  audio: '🎧', wearables: '⌚', home: '💡', kitchen: '☕', 'on-the-go': '🎒',
                }[c.slug]}</span>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-3 pt-8">
                  <p className="font-display text-sm font-bold text-white">{c.name}</p>
                  <p className="text-xs text-white/80">{counts[c.slug] || 0} products</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Featured ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Customer favourites</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">Featured this week</h2>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700">
            Shop all <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ---------- Demo CTA ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-stone-900 px-6 py-14 text-center sm:px-16">
          <div aria-hidden className="absolute -left-20 -top-24 size-72 rounded-full bg-brand-600/30 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -right-16 size-72 rounded-full bg-accent-500/20 blur-3xl" />
          <h2 className="relative font-display text-3xl font-bold text-white sm:text-4xl">
            Try the full purchase flow — under two minutes
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-stone-400">
            Add a product to the cart, then pay by Stripe test card <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-sm text-white">4242 4242 4242 4242</span> or a PayPal sandbox account — watch the order appear in the admin panel, no code touched.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/shop" className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-stone-900 transition hover:bg-stone-200">Start shopping</Link>
            <Link to="/admin/login" className="rounded-xl border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">Open admin panel</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
