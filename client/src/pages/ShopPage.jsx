import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import ProductCard from '../components/ProductCard'
import { EmptyState, Loader, Reveal, Select } from '../components/ui'
import { CATEGORIES } from '../data/seedProducts'
import { cx } from '../lib/cx'

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low → high' },
  { value: 'price-desc', label: 'Price: high → low' },
  { value: 'rating', label: 'Top rated' },
]

export default function ShopPage() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || 'all'
  const q = params.get('q') || ''
  const sort = params.get('sort') || 'featured'

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const { data: products, loading, error } = useFetch(
    () => api.products.list({ category, q, sort }),
    [category, q, sort]
  )
  const { data: all } = useFetch(() => api.products.list(), [])

  const counts = useMemo(
    () => (all || []).reduce((m, p) => ({ ...m, [p.category]: (m[p.category] || 0) + 1 }), {}),
    [all]
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="animate-fade-in-up mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Catalogue</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-stone-900 sm:text-4xl">
          {q ? <>Results for “{q}”</> : category === 'all' ? 'All products' : `${CATEGORIES.find((c) => c.slug === category)?.name} `}
        </h1>
        <p className="mt-2 text-stone-500">{products ? `${products.length} product${products.length === 1 ? '' : 's'}` : '…'}{q && category !== 'all' ? ` in ${category}` : ''}</p>
      </div>

      {/* Category chips (mobile) + sidebar (desktop) */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none lg:hidden">
        <Chip active={category === 'all'} onClick={() => setParam('category', 'all')}>All</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.slug} active={category === c.slug} onClick={() => setParam('category', c.slug)}>
            {c.name} · {counts[c.slug] || 0}
          </Chip>
        ))}
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400"><SlidersHorizontal className="size-3.5" /> Categories</h2>
              <div className="space-y-1">
                <SideLink active={category === 'all'} onClick={() => setParam('category', 'all')}>
                  All products <Count n={(all || []).length} />
                </SideLink>
                {CATEGORIES.map((c) => (
                  <SideLink key={c.slug} active={category === c.slug} onClick={() => setParam('category', c.slug)}>
                    {c.name} <Count n={counts[c.slug] || 0} />
                  </SideLink>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-brand-50 p-4 text-sm">
              <p className="font-display font-bold text-brand-900">Delivery promise</p>
              <p className="mt-1 leading-relaxed text-brand-800/80">Free tracked shipping over $150. 30-day returns on everything.</p>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-3">
            {(q || category !== 'all') && (
              <Link to="/shop" className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-600 hover:border-stone-400">
                Clear filters <X className="size-3" />
              </Link>
            )}
            <div className={cx('ml-auto flex items-center gap-2', !q && category === 'all' && 'ml-auto')}>
              <Select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="w-auto py-2 text-sm" aria-label="Sort products">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error.message}</div>
          )}
          {loading && <Loader label="Loading products…" />}
          {!loading && products?.length === 0 && (
            <EmptyState
              icon={<PackageSearch className="size-12" />}
              title="Nothing here yet"
              body={q ? `No products matched “${q}”. Try a different search.` : 'No products in this category — check back soon.'}
              action={<Link to="/shop" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white">Browse all</Link>}
            />
          )}
          {!loading && products?.length > 0 && (
            <div key={`${category}-${q}-${sort}`} className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i, 8) * 40}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={cx(
      'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition',
      active ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white text-stone-600 hover:border-stone-500'
    )}
  >
    {children}
  </button>
)

const SideLink = ({ active, onClick, children }) => (
  <button type="button" onClick={onClick} className={cx('flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition', active ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-100')}>
    {children}
  </button>
)

const Count = ({ n }) => <span className="text-xs font-medium text-stone-400 tabular-nums">{n}</span>
