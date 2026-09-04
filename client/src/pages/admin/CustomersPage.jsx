import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Search, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { EmptyState, Loader, PageHeader, Pill, Td, Th } from '../../components/ui'
import { money, timeAgo } from '../../lib/format'

export default function CustomersPage() {
  const [q, setQ] = useState('')
  const { data, loading } = useFetch(() => api.customers.list({ q }), [q])

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Everyone who has checked out. New orders add customers automatically."
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email…"
              className="w-64 rounded-lg border border-stone-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>
        }
      />

      {loading && <Loader label="Loading customers…" />}
      {!loading && data?.length === 0 && (
        <EmptyState
          icon={<Users className="size-12" />}
          title={q ? 'No matches' : 'No customers yet'}
          body={q ? `Nothing matched “${q}”.` : "Once customers place orders they'll appear here."}
        />
      )}

      {!loading && data?.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-stone-100 bg-stone-50/60">
                <tr>
                  <Th>Customer</Th>
                  <Th>Location</Th>
                  <Th>Orders</Th>
                  <Th>Total spent</Th>
                  <Th>Last order</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map((c) => (
                  <tr key={c.id} className="transition hover:bg-stone-50/70">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 font-display font-bold text-brand-700">
                          {c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-stone-800">{c.name}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-stone-400"><Mail className="size-3" /> {c.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap">{c.city || '—'}</Td>
                    <Td>
                      {c.orders > 0 ? <Pill tone="indigo">{c.orders} order{c.orders === 1 ? '' : 's'}</Pill> : <Pill tone="gray">No orders</Pill>}
                    </Td>
                    <Td className="font-bold tabular-nums text-stone-900 whitespace-nowrap">{c.totalSpent ? money(c.totalSpent) : '—'}</Td>
                    <Td className="text-xs text-stone-400 whitespace-nowrap">{c.lastOrderAt ? timeAgo(c.lastOrderAt) : 'Never'}</Td>
                    <Td className="text-right">
                      <Link to="/admin/orders" className="text-xs font-bold text-brand-600 hover:underline">See orders</Link>
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
