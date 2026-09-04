import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { api } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { Loader, PageHeader, Pill, Select, StatusPill, Td, Th } from '../../components/ui'
import { money, timeAgo } from '../../lib/format'
import { nextStatuses } from '../../lib/orderStatus'
import { cx } from '../../lib/cx'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function OrdersPage() {
  const [tab, setTab] = useState('all')
  const { data, loading, error, reload } = useFetch(() => api.orders.list())
  const [busyRef, setBusyRef] = useState(null)

  const all = data || []
  const rows = tab === 'all' ? all : all.filter((o) => o.status === tab)
  const count = (k) => (k === 'all' ? all.length : all.filter((o) => o.status === k).length)

  const changeStatus = async (ref, status) => {
    setBusyRef(ref)
    try {
      await api.orders.setStatus(ref, status)
      reload()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setBusyRef(null)
    }
  }

  return (
    <div>
      <PageHeader title="Orders" subtitle="Fulfil orders and keep the tracking timeline fresh for customers." />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cx(
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              tab === t.key ? 'bg-stone-900 text-white' : 'border border-stone-300 bg-white text-stone-600 hover:border-stone-500'
            )}
          >
            {t.label} <span className="tabular-nums opacity-60">{count(t.key)}</span>
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error.message}</div>}
      {loading && <Loader label="Loading orders…" />}
      {!loading && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
          <p className="font-display font-bold text-stone-800">No {tab !== 'all' ? `${tab} ` : ''}orders</p>
          <p className="mt-1 text-sm text-stone-500">New customer orders will appear here as they're placed.</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((o) => (
            <div key={o.ref} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/order/${o.ref}`} className="font-mono font-bold text-brand-700 hover:underline">{o.ref}</Link>
                    <span className="hidden rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-400 sm:inline">VIEW</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-stone-800">{o.customer.name}</p>
                  <p className="truncate text-xs text-stone-400">{o.customer.email} · {timeAgo(o.createdAt)}</p>
                </div>

                <div className="hidden flex-wrap gap-1.5 md:flex">
                  {o.items.slice(0, 4).map((it) => (
                    <span key={it.productId} title={it.name} className="grid size-9 place-items-center rounded-lg bg-stone-100 text-lg">{it.emoji}</span>
                  ))}
                  {o.items.length > 4 && <span className="grid size-9 place-items-center rounded-lg bg-stone-100 text-xs font-bold text-stone-500">+{o.items.length - 4}</span>}
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold tabular-nums text-stone-900">{money(o.total)}</p>
                    <p className="text-xs text-stone-400">{o.items.reduce((s, i) => s + i.qty, 0)} item{o.items.reduce((s, i) => s + i.qty, 0) === 1 ? '' : 's'} · {o.payment?.method === 'paypal' ? `PayPal · ${o.payment?.email}` : `${o.payment?.brand} •••• ${o.payment?.last4}`}</p>
                  </div>

                  <StatusPill status={o.status} />

                  <div className="flex items-center gap-1">
                    <Select
                      value=""
                      onChange={(e) => e.target.value && changeStatus(o.ref, e.target.value)}
                      disabled={busyRef === o.ref}
                      className="w-auto py-2 text-xs font-semibold disabled:opacity-60"
                      aria-label={`Change status of ${o.ref}`}
                    >
                      <option value="">Set status…</option>
                      {nextStatuses(o.status).map((s) => (
                        <option key={s} value={s}>{s === 'cancelled' ? 'Cancel order' : `Mark ${s}`}</option>
                      ))}
                    </Select>
                    <Link to={`/order/${o.ref}`} className="grid size-9 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-brand-600" title="Open customer tracking view">
                      <ExternalLink className="size-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* line items for smaller screens */}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3 md:hidden">
                {o.items.map((it) => (
                  <Pill key={it.productId} tone="gray" className="gap-1.5">
                    <span>{it.emoji}</span> {it.qty} × {it.name.length > 24 ? it.name.slice(0, 24) + '…' : it.name}
                  </Pill>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
