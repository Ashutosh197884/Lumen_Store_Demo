import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, ShoppingCart, X, Truck, Lock } from 'lucide-react'
import { Logo, ToastHost } from '../components/ui'
import { useCart } from '../context/CartContext'
import { CATEGORIES } from '../data/seedProducts'
import { STORE } from '../lib/settings'
import { cx } from '../lib/cx'

const navLink = ({ isActive }) =>
  cx(
    'rounded-lg px-3 py-2 text-sm font-semibold transition',
    isActive ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:text-stone-900'
  )

export default function StorefrontLayout() {
  const { count } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [q, setQ] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop')
    setMenuOpen(false)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Announcement */}
      <div className="bg-stone-900 px-4 py-2 text-center text-xs font-medium text-stone-300">
        Demo store · Free shipping over ${STORE.FREE_SHIPPING_OVER} · Test payments: Stripe card 4242 4242 4242 4242 & PayPal sandbox
      </div>

      {/* Header */}
      <header className={cx('sticky top-0 z-40 border-b bg-white/90 backdrop-blur transition-shadow duration-300', scrolled ? 'border-stone-200 shadow-md shadow-stone-900/5' : 'border-transparent')}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <button type="button" className="grid size-10 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <Link to="/" className="shrink-0">
            <Logo />
          </Link>

          <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Main">
            <NavLink to="/" end className={navLink}>Home</NavLink>
            <NavLink to="/shop" className={navLink}>Shop</NavLink>
            <NavLink to="/track" className={navLink}>Track order</NavLink>
          </nav>

          <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-full border border-stone-200 bg-stone-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <Link to="/admin/login" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-stone-500 hover:text-stone-900 sm:inline-flex" title="Admin panel">
              <Lock className="size-4" />
            </Link>
            <Link to="/cart" className="relative grid size-10 place-items-center rounded-lg text-stone-700 hover:bg-stone-100" aria-label={`Cart, ${count} items`}>
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span key={count} className="animate-pop absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="animate-fade-in-up border-t border-stone-200 bg-white px-4 pb-4 pt-2 lg:hidden">
            <form onSubmit={submitSearch} className="mb-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full rounded-full border border-stone-200 bg-stone-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400" />
              </div>
            </form>
            <div className="flex flex-col gap-1">
              {[
                { to: '/', label: 'Home' },
                { to: '/shop', label: 'Shop all' },
                { to: '/track', label: 'Track order' },
                { to: '/admin/login', label: 'Admin login' },
              ].map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Page — keyed by path so each route change replays a gentle fade */}
      <main key={location.pathname} className="flex-1 animate-fade-in">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-stone-900 text-stone-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-400">
              Modern essentials for everyday life. A demo storefront — React store + Laravel API blueprint, with Stripe + PayPal test-mode payments.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-stone-400">
              <Truck className="size-3.5" /> Free shipping over ${STORE.FREE_SHIPPING_OVER}
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">Shop</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/shop" className="hover:text-white">All products</Link></li>
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link to={`/shop?category=${c.slug}`} className="hover:text-white">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">Support</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/track" className="hover:text-white">Track your order</Link></li>
              <li><Link to="/cart" className="hover:text-white">View cart</Link></li>
              <li><Link to="/checkout" className="hover:text-white">Checkout</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">Store</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>orders@lumen.test</li>
              <li>Mon–Sat, 9:00–18:00</li>
              <li><Link to="/admin/login" className="text-stone-500 hover:text-stone-300">Admin area</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-stone-500 sm:px-6">
            <span>© {new Date().getFullYear()} Lumen — demo build. All data is sample content.</span>
            <span>React 19 · Tailwind · Laravel-ready API layer</span>
          </div>
        </div>
      </footer>

      <ToastHost />
    </div>
  )
}
