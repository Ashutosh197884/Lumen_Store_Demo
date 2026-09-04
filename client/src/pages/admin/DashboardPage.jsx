import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, ClipboardList, DollarSign, Package, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { Loader, PageHeader, Pill, StatCard, StatusPill, Td, Th } from '../../components/ui'
import { money, timeAgo } from '../../lib/format'
import { STORE } from '../../lib/settings'

export default function DashboardPage() {
  const { data, loading, error, reload } = useFetch(() => api.stats.overview())

  if (loading || !data) return <Loader label="Crunching numbers…" />

  const { stats, lowStock, recentOrders, byDay } = data
  const maxDay = Math.max(1, ...byDay.map((d) => d.revenue))

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Store snapshot — ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`}
        actions={error ? <span className="text-sm text-red-600">{error.message}</span> : null}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<DollarSign className="size-5" />} label="Revenue" value={money(stats.revenue)} sub={`${stats.last7Orders} orders in last 7 days`} />
        <StatCard icon={<ClipboardList className="size-5" />} label="Orders" value={stats.orders} sub={`${stats.pendingOrders} awaiting fulfilment`} accent="text-sky-600" />
        <StatCard icon={<Users className="size-5" />} label="Customers" value={stats.customers} sub="Across all orders" accent="text-violet-600" />
        <StatCard
          icon={<Package className="size-5" />}
          label="Products"
          value={stats.products}
          sub={`${stats.outOfStock} sold out`}
          accent={stats.lowStock > 0 ? 'text-red-500' : 'text-emerald-600'}
        />
      </div>

      {stats.lowStock > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-accent-200 bg-accent-50 px-5 py-4 text-sm">
          <AlertTriangle className="size-5 text-accent-600" />
          <p className="font-semibold text-stone-800">
            {stats.lowStock} product{stats.lowStock === 1 ? '' : 's'} at or below {STORE.LOW_STOCK_THRESHOLD} units
          </p>
          <Link to="/admin/inventory" className="ml-auto inline-flex items-center gap-1 font-bold text-accent-600 hover:underline">Review stock <ArrowRight className="size-4" /></Link>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Revenue chart */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-stone-900">Revenue · last 7 days</h2>
          <div className="mt-6 flex h-44 items-end gap-3">
            {byDay.map((d) => (
              <div key={d.day} className="group flex flex-1 flex-col items-center gap-2" title={`${money(d.revenue)} · ${d.orders} orders`}>
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 transition group-hover:from-brand-700 group-hover:to-brand-500"
                    style={{ height: `${Math.max(4, (d.revenue / maxDay) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-stone-400">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {byDay.map((d) => (
              <Pill key={d.day} tone="gray" className="hidden xl:inline-flex">{d.day} · {money(d.revenue)} ({d.orders})</Pill>
            ))}
          </div>
        </section>

        {/* Low stock */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-stone-900">Low stock</h2>
            <Link to="/admin/inventory" className="text-sm font-bold text-brand-600 hover:underline">Manage →</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">All products are well stocked. 🎉</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-xl">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/products/${p.id}/edit`} className="block truncate text-sm font-bold text-stone-800 hover:text-brand-700">{p.name}</Link>
                    <p className="text-xs text-stone-400">{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</p>
                  </div>
                  {p.stock === 0 ? <Pill tone="red">Out</Pill> : <Pill tone="amber">Low</Pill>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent orders */}
      <section className="mt-6 rounded-2xl border border-stone-200 bg-white shadow-card">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="font-display text-lg font-bold text-stone-900">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm font-bold text-brand-600 hover:underline">View all →</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-y border-stone-100 bg-stone-50/60">
              <tr><Th>Order</Th><Th>Customer</Th><Th>Items</Th><Th>Total</Th><Th>Status</Th><Th>Placed</Th></tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentOrders.map((o) => (
                <tr key={o.ref} className="transition hover:bg-stone-50/70">
                  <Td><Link to={`/order/${o.ref}`} className="font-mono font-bold text-brand-700 hover:underline">{o.ref}</Link></Td>
                  <Td>
                    <p className="font-semibold text-stone-800">{o.customer.name}</p>
                    <p className="text-xs text-stone-400">{o.customer.email}</p>
                  </Td>
                  <Td className="tabular-nums">{o.items.reduce((s, i) => s + i.qty, 0)}</Td>
                  <Td className="font-bold text-stone-900 tabular-nums">{money(o.total)}</Td>
                  <Td><StatusPill status={o.status} /></Td>
                  <Td className="text-xs text-stone-400">{timeAgo(o.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end p-4">
          <button type="button" onClick={reload} className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-500 transition hover:bg-stone-100">Refresh</button>
        </div>
      </section>
    </div>
  )
}
