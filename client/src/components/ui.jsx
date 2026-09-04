import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Star, StarHalf } from 'lucide-react'
import { cx } from '../lib/cx'
import { money } from '../lib/format'
import { ORDER_STATUS } from '../lib/orderStatus'
import { CATEGORY_MAP } from '../data/seedProducts'
import { subscribeToast } from '../lib/toast'

/* ---------- Brand mark ---------- */
export const Logo = ({ dark = false, small = false }) => (
  <span className={cx('inline-flex items-center gap-2 font-display font-bold tracking-tight', small ? 'text-lg' : 'text-xl')}>
    <span className="grid size-7 place-items-center rounded-lg bg-brand-600 text-sm text-white shadow-sm">L</span>
    <span className={dark ? 'text-white' : 'text-stone-900'}>Lumen</span>
  </span>
)

/* ---------- Price ---------- */
const sizeCls = { sm: 'text-sm', md: 'text-lg', lg: 'text-3xl' }
export const Price = ({ amount, compareAt, className, size = 'sm' }) => (
  <span className={cx('inline-flex items-baseline gap-2', className)}>
    <span className={cx('font-semibold text-stone-900 tabular-nums', sizeCls[size])}>{money(amount)}</span>
    {compareAt != null && compareAt > amount && (
      <span className={cx('text-stone-400 line-through tabular-nums', size === 'sm' ? 'text-xs' : 'text-sm')}>{money(compareAt)}</span>
    )}
  </span>
)

/* ---------- Stars ---------- */
export const Rating = ({ value, reviews, className }) => (
  <span className={cx('inline-flex items-center gap-1.5 text-sm text-stone-600', className)}>
    <span className="inline-flex text-accent-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cx('size-3.5', n <= Math.round(value) ? 'fill-current' : 'text-stone-300')} />
      ))}
    </span>
    <span className="font-medium text-stone-700 tabular-nums">{value?.toFixed(1)}</span>
    {reviews != null && <span className="text-stone-400">({reviews})</span>}
  </span>
)

/* ---------- Pills / badges ---------- */
const toneMap = {
  gray: 'bg-stone-100 text-stone-600 ring-stone-200',
  indigo: 'bg-brand-50 text-brand-700 ring-brand-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-accent-50 text-accent-600 ring-accent-200',
}

export const Pill = ({ tone = 'gray', children, className }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', toneMap[tone], className)}>
    {children}
  </span>
)

export const StatusPill = ({ status }) => <Pill tone={ORDER_STATUS[status]?.tone || 'gray'}>{ORDER_STATUS[status]?.label || status}</Pill>

export const Badge = ({ children }) => (
  <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-stone-800 shadow-sm backdrop-blur">
    {children}
  </span>
)

/* ---------- Artwork tile (emoji on category gradient — replaced by real photos in production) ---------- */
export const GradientTile = ({ product, className, tileClassName }) => {
  const g = CATEGORY_MAP[product.category]?.gradient || 'from-stone-400 to-stone-500'
  return (
    <div className={cx('overflow-hidden', className)}>
      <div className={cx('grid size-full place-items-center bg-gradient-to-br', g, tileClassName || '')}>
        <span className="drop-shadow-sm" role="img" aria-label={product.name}>
          {product.emoji}
        </span>
      </div>
    </div>
  )
}

/* ---------- Quantity stepper ---------- */
export const QtyStepper = ({ value, onChange, max = 99, size = 'md' }) => {
  const btn = cx(
    'grid place-items-center rounded-md text-stone-600 transition hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent',
    size === 'sm' ? 'size-6' : 'size-8'
  )
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-1 py-0.5">
      <button type="button" className={btn} onClick={() => onChange(Math.max(0, value - 1))} aria-label="Decrease quantity" disabled={value <= 0}>
        −
      </button>
      <span className={cx('min-w-7 text-center font-semibold tabular-nums', size === 'sm' ? 'text-sm' : '')}>{value}</span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} aria-label="Increase quantity" disabled={value >= max}>
        +
      </button>
    </div>
  )
}

/* ---------- Motion helpers ---------- */
export const Reveal = ({ as: Tag = 'div', delay = 0, className, children, ...rest }) => {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVis(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVis(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={cx('reveal', vis && 'is-visible', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* ---------- Toasts ---------- */
export const ToastHost = () => {
  const [toasts, setToasts] = useState([])

  useEffect(
    () =>
      subscribeToast((t) => {
        setToasts((prev) => [...prev.slice(-2), t])
        setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 2400)
      }),
    []
  )

  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="animate-slide-up pointer-events-auto flex max-w-full items-center gap-2 rounded-full bg-stone-900/95 py-2.5 pl-4 pr-5 text-sm font-semibold text-white shadow-elevated backdrop-blur"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          <span className="truncate">{t.message}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- Feedback ---------- */
export const Spinner = ({ className }) => (
  <span className={cx('inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent align-middle', className)} aria-label="Loading" />
)

export const Loader = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-24" role="status" aria-label={label}>
    <div className="animate-float grid size-12 place-items-center rounded-2xl bg-brand-600 text-lg font-bold text-white shadow-lg shadow-brand-600/30">L</div>
    <div className="h-3 w-28 animate-shimmer rounded-full bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200" />
    <p className="text-sm text-stone-400">{label}</p>
  </div>
)

export const EmptyState = ({ icon, title, body, action }) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
    {icon && <div className="mb-1 text-stone-300">{icon}</div>}
    <h3 className="font-display text-lg font-semibold text-stone-800">{title}</h3>
    {body && <p className="max-w-sm text-sm text-stone-500">{body}</p>}
    {action}
  </div>
)

/* ---------- Forms ---------- */
export const labelCls = 'mb-1.5 block text-sm font-semibold text-stone-700'
export const inputCls =
  'w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200'

export const Field = ({ label, hint, error, className, children }) => (
  <label className={cx('block', className)}>
    {label && <span className={labelCls}>{label}</span>}
    {children}
    {hint && !error && <span className="mt-1 block text-xs text-stone-400">{hint}</span>}
    {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
  </label>
)

export const Input = (props) => <input {...props} className={inputCls} />
export const Select = (props) => <select {...props} className={inputCls} />
export const Textarea = (props) => <textarea rows={3} {...props} className={inputCls} />

export const Button = ({ variant = 'primary', loading, className, children, ...props }) => {
  const styles = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20 disabled:bg-brand-300',
    secondary:
      'border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50 disabled:opacity-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
    ghost: 'text-stone-600 hover:bg-stone-100 disabled:opacity-50',
  }
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed',
        styles[variant],
        className
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

/* ---------- Admin bits ---------- */
export const StatCard = ({ icon, label, value, sub, accent = 'text-brand-600' }) => (
  <div className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-card">
    <div className={cx('grid size-10 shrink-0 place-items-center rounded-xl bg-stone-50', accent)}>{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-0.5 truncate font-display text-2xl font-bold text-stone-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  </div>
)

export const Th = ({ children, className }) => (
  <th className={cx('whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-stone-500', className)}>{children}</th>
)
export const Td = ({ children, className }) => <td className={cx('px-4 py-3 text-sm text-stone-700 align-middle', className)}>{children}</td>

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="font-display text-2xl font-bold text-stone-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
    </div>
    {actions}
  </div>
)
