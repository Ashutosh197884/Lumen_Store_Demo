import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Check, ChevronRight, PackageCheck, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import ProductCard from '../components/ProductCard'
import { Badge, Button, GradientTile, Loader, Pill, Price, QtyStepper, Rating } from '../components/ui'
import { useCart } from '../context/CartContext'
import { CATEGORY_MAP } from '../data/seedProducts'
import { STORE } from '../lib/settings'
import { cx } from '../lib/cx'

export default function ProductPage() {
  const { id } = useParams()
  const { add } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const { data: product, loading, error } = useFetch(() => api.products.get(id), [id])
  const { data: related } = useFetch(
    () => api.products.list({ category: product?.category, includeInactive: false }),
    [product?.category]
  )

  if (loading || !product) return <Loader label="Loading product…" />
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900">Product unavailable</h1>
        <p className="mt-2 text-stone-500">{error.message}</p>
        <Link to="/shop" className="mt-6 inline-block rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white">Back to the shop</Link>
      </div>
    )
  }

  const out = product.stock === 0
  const low = !out && product.stock <= STORE.LOW_STOCK_THRESHOLD
  const relatedList = (related || []).filter((p) => p.id !== product.id).slice(0, 4)
  const catName = CATEGORY_MAP[product.category]?.name || product.category

  const handleAdd = () => {
    add(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-stone-400" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-stone-700">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link to="/shop" className="hover:text-stone-700">Shop</Link>
        <ChevronRight className="size-3.5" />
        <Link to={`/shop?category=${product.category}`} className="hover:text-stone-700">{catName}</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-stone-600">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Art */}
        <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white">
          {product.badges?.length > 0 && <Badge>{product.badges.join(' · ')}</Badge>}
          <GradientTile product={product} className="aspect-square" tileClassName="text-[10rem]" />
          {out && (
            <div className="absolute inset-0 grid place-items-center bg-stone-900/50">
              <span className="rounded-full bg-stone-900/90 px-6 py-2 text-sm font-bold text-white">Sold out</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <Pill tone="gray">{catName}</Pill>
            {product.sku && <span className="text-xs text-stone-400">SKU {product.sku}</span>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{product.name}</h1>
          <div className="mt-3">
            <Rating value={product.rating} reviews={product.reviews} />
          </div>

          <div className="mt-5 flex items-end gap-4">
            <Price amount={product.price} compareAt={product.compareAt} size="lg" />
            <span className={cx('pb-1 text-sm font-bold', out ? 'text-red-600' : low ? 'text-accent-600' : 'text-emerald-600')}>
              {out ? 'Sold out' : low ? `Only ${product.stock} left in stock` : 'In stock'}
            </span>
          </div>

          <p className="mt-6 leading-relaxed text-stone-600">{product.description}</p>

          {product.features?.length > 0 && (
            <ul className="mt-6 space-y-2.5">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-stone-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-600" /> {f}
                </li>
              ))}
            </ul>
          )}

          {/* Buy box */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QtyStepper value={qty} onChange={setQty} max={Math.max(1, product.stock)} />
            <Button onClick={handleAdd} disabled={out} className={cx('min-w-52 px-8', added ? 'bg-emerald-600 hover:bg-emerald-700' : '')}>
              {added ? (<><PackageCheck className="size-4" /> Added to cart</>) : (<><span className="font-bold">Add to cart</span> — <Price amount={product.price} /></>)}
            </Button>
          </div>
          {added && (
            <p className="mt-2 animate-fade-in text-sm text-emerald-700">
              Added {qty} × {product.name}. <Link to="/cart" className="font-bold underline underline-offset-2">View cart →</Link>
            </p>
          )}

          <div className="mt-8 grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600 sm:grid-cols-3">
            <span className="flex items-center gap-2"><Truck className="size-4 text-brand-600" /> Free ship over {`$${STORE.FREE_SHIPPING_OVER}`}</span>
            <span className="flex items-center gap-2"><RotateCcw className="size-4 text-brand-600" /> 30-day returns</span>
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand-600" /> Secure checkout</span>
          </div>
        </div>
      </div>

      {/* Reviews (sample) */}
      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold text-stone-900">Reviews</h2>
        <div className="mt-5 space-y-4">
          {sampleReviews(product).map((r, i) => (
            <div key={`${r.author}-${i}`} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{r.author[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{r.author}</p>
                    <p className="text-xs text-stone-400">{r.when} · Verified purchase <BadgeCheck className="inline size-3 text-emerald-500" /></p>
                  </div>
                </div>
                <Rating value={r.stars} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      {relatedList.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-stone-900">You may also like</h2>
            <Link to={`/shop?category=${product.category}`} className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700">
              More {catName.toLowerCase()} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedList.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}

const sampleReviews = (product) => [
  {
    author: 'Verified customer',
    stars: product.rating,
    when: '2 weeks ago',
    text: `Exactly as described — ${product.name.toLowerCase()} looks great and arrived two days early. Packaging was spotless.`,
  },
  {
    author: 'Verified customer',
    stars: Math.max(4, product.rating - 0.2),
    when: '1 month ago',
    text: 'Quality feels well above the price point. Would buy from Lumen again without hesitation.',
  },
]
