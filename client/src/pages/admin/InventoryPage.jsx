import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, PackageSearch, Plus, RotateCcw } from 'lucide-react'
import { api } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { EmptyState, GradientTile, Loader, PageHeader, Pill, Td, Th } from '../../components/ui'
import { STORE } from '../../lib/settings'
import { cx } from '../../lib/cx'

export default function InventoryPage() {
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const { data, loading, reload } = useFetch(() => api.products.list({ includeInactive: true }))

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'low', label: `Low (≤ ${STORE.LOW_STOCK_THRESHOLD})` },
    { key: 'out', label: 'Sold out' },
  ]

  const rows = (data || []).filter((p) =>
    filter === 'low' ? p.stock <= STORE.LOW_STOCK_THRESHOLD : filter === 'out' ? p.stock === 0 : true
  )

  const adjust = async (p, delta) => {
    setBusyId(p.id)
    try {
      await api.inventory.adjust(p.id, delta, delta > 0 ? 'manual restock' : 'manual removal')
      reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Stock levels update the storefront instantly. Orders decrement stock automatically."
        actions={
          <button type="button" onClick={reload} className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50">
            <RotateCcw className="size-4" /> Refresh
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cx(
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              filter === f.key ? 'bg-stone-900 text-white' : 'border border-stone-300 bg-white text-stone-600 hover:border-stone-500'
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto hidden items-center text-xs text-stone-400 sm:flex">Every change is written to the inventory log on the server.</span>
      </div>

      {loading && <Loader label="Reading stock…" />}
      {!loading && rows.length === 0 && (
        <EmptyState
          icon={<PackageSearch className="size-12" />}
          title="Nothing to show here"
          body={filter === 'all' ? 'No products yet — add some first.' : 'Good news: no products in this state.'}
        />
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-stone-100 bg-stone-50/60">
                <tr><Th>Product</Th><Th>Price</Th><Th>On hand</Th><Th>Status</Th><Th className="text-right">Adjust</Th></tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((p) => (
                  <tr key={p.id} className="transition hover:bg-stone-50/70">
                    <Td>
                      <div className="flex items-center gap-3">
                        <GradientTile product={p} className="size-11 shrink-0 rounded-lg" tileClassName="text-2xl" />
                        <div className="min-w-0">
                          <Link to={`/admin/products/${p.id}/edit`} className="block truncate font-bold text-stone-800 hover:text-brand-700">{p.name}</Link>
                          <p className="text-xs text-stone-400">{p.sku} · {p.active ? 'live' : 'hidden'}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="font-semibold tabular-nums whitespace-nowrap">${p.price}</Td>
                    <Td>
                      <span className={cx('inline-flex items-center gap-1 font-display text-lg font-bold tabular-nums', p.stock === 0 ? 'text-red-600' : p.stock <= STORE.LOW_STOCK_THRESHOLD ? 'text-accent-600' : 'text-stone-900')}>
                        {busyId === p.id ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : p.stock}
                      </span>
                      <span className="ml-1 text-xs text-stone-400">units</span>
                    </Td>
                    <Td>{p.stock === 0 ? <Pill tone="red">Sold out</Pill> : p.stock <= STORE.LOW_STOCK_THRESHOLD ? <Pill tone="amber">Low stock</Pill> : <Pill tone="green">Healthy</Pill>}</Td>
                    <Td className="text-right">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1">
                        <button type="button" onClick={() => adjust(p, -1)} disabled={p.stock === 0 || busyId === p.id} className="grid size-8 place-items-center rounded-md bg-white text-stone-600 shadow-sm transition hover:text-red-600 disabled:opacity-40" aria-label={`Remove one unit of ${p.name}`}>
                          <Minus className="size-4" />
                        </button>
                        <button type="button" onClick={() => adjust(p, 1)} disabled={busyId === p.id} className="grid size-8 place-items-center rounded-md bg-white text-stone-600 shadow-sm transition hover:text-emerald-600 disabled:opacity-40" aria-label={`Add one unit of ${p.name}`}>
                          <Plus className="size-4" />
                        </button>
                        <button type="button" onClick={() => adjust(p, 10)} disabled={busyId === p.id} className="rounded-md bg-white px-2.5 py-1.5 text-xs font-bold text-stone-600 shadow-sm transition hover:text-emerald-700 disabled:opacity-40">
                          +10
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
