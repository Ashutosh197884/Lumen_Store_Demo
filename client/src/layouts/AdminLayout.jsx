import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ClipboardList, LayoutDashboard, LogOut, Menu, Package, Boxes, Store, Users, X,
} from 'lucide-react'
import { Logo } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { cx } from '../lib/cx'

const items = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/customers', label: 'Customers', icon: Users },
]

export default function AdminLayout() {
  const { isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  if (!isAdmin) return <Navigate to="/admin/login" replace />

  const side = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <Logo dark small />
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-300">Admin</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Admin">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                isActive ? 'bg-white/10 text-white' : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
              )
            }
          >
            <it.icon className="size-4.5" />
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-400 transition hover:bg-white/5 hover:text-stone-200">
          <Store className="size-4.5" /> View storefront
        </Link>
        <button
          type="button"
          onClick={() => { logout(); navigate('/admin/login') }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="size-4.5" /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-stone-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-stone-900 lg:block">{side}</aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-stone-900/50" onClick={() => setOpen(false)} />
          <aside className="animate-slide-in-left absolute inset-y-0 left-0 w-72 bg-stone-900 shadow-elevated">
            <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-4 grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-white/10" aria-label="Close menu">
              <X className="size-5" />
            </button>
            {side}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-stone-200 bg-white px-4 sm:px-6">
          <button type="button" className="grid size-10 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <h2 className="hidden font-display text-sm font-bold text-stone-500 sm:block">Store control panel</h2>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 sm:block">Demo mode</span>
            <Link to="/" className="text-sm font-semibold text-stone-500 hover:text-stone-900">Open store →</Link>
          </div>
        </header>

        <main key={location.pathname} className="animate-fade-in p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
