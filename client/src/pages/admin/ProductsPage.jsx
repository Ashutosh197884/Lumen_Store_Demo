import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PackagePlus, Pencil, Search, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { Button, EmptyState, Loader, PageHeader, Pill, Select, Td, Th } from '../../components/ui'
import { money } from '../../lib/format'
import { CATEGORIES } from '../../data/seedProducts'
import { STORE } from '../../lib/settings'
import { GradientTile } from '../../components/ui'

export default function ProductsPage() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('all')
  const { data, loading, error, reload } = useFetch(() => api.products.list({ q, category, includeInactive: true }), [q, category])

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? This also removes it from the storefront.`)) return
    try {
      await api.products.remove(p.id)
      reload()
    } catch (err) {
      window.alert(err.message)
    }
  }

  const toggle = async (p) => {
    try {
      await api.products.update(p.id, { ...p, active: !p.active })
      reload()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Add, edit and delist products — no code required."
        actions={
          <Link to="/admin/products/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700">
            <PackagePlus className="size-4" /> Add product
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or SKU…" className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto py-2.5">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </Select>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error.message}</div>}
      {loading && <Loader label="Loading products…" />}
      {!loading && data?.length === 0 && (
        <EmptyState
          title="No products found"
          body="Try a different search, or add your first product."
          action={<Link to="/admin/products/new" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white">Add product</Link>}
        />
      )}

      {!loading && data?.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-stone-100 bg-stone-50/60">
                <tr>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th>Price</Th>
                  <Th>Stock</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map((p) => (
                  <tr key={p.id} className={`transition hover:bg-stone-50/70 ${p.active ? '' : 'opacity-60'}`}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <GradientTile product={p} className="size-11 shrink-0 rounded-lg" tileClassName="text-2xl" />
                        <div className="min-w-0">
                          <Link to={`/admin/products/${p.id}/edit`} className="block truncate font-bold text-stone-800 hover:text-brand-700">{p.name}</Link>
                          <p className="text-xs text-stone-400">{p.sku} {p.badges?.length > 0 && `· ${p.badges.join(', ')}`}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap">{CATEGORIES.find((c) => c.slug === p.category)?.name || p.category}</Td>
                    <Td className="font-semibold tabular-nums text-stone-900 whitespace-nowrap">
                      {money(p.price)}
                      {p.compareAt && <span className="ml-1.5 text-xs text-stone-400 line-through">{money(p.compareAt)}</span>}
                    </Td>
                    <Td>
                      {p.stock === 0 ? <Pill tone="red">Sold out</Pill> : p.stock <= STORE.LOW_STOCK_THRESHOLD ? <Pill tone="amber">{p.stock} left</Pill> : <Pill tone="green">{p.stock} in stock</Pill>}
                    </Td>
                    <Td>
                      <button type="button" onClick={() => toggle(p)} className="text-left">
                        {p.active ? <Pill tone="green">Live</Pill> : <Pill tone="gray">Hidden</Pill>}
                      </button>
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Link to={`/admin/products/${p.id}/edit`} className="grid size-9 place-items-center rounded-lg text-stone-500 transition hover:bg-brand-50 hover:text-brand-700" title="Edit product"><Pencil className="size-4" /></Link>
                        <button type="button" onClick={() => remove(p)} className="grid size-9 place-items-center rounded-lg text-stone-500 transition hover:bg-red-50 hover:text-red-600" title="Delete product"><Trash2 className="size-4" /></button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3">
            <p className="text-xs text-stone-400">{data.length} product{data.length === 1 ? '' : 's'} shown</p>
            <Button variant="ghost" onClick={reload} className="text-xs">Refresh</Button>
          </div>
        </div>
      )}
    </div>
  )
}
