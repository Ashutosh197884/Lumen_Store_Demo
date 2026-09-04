import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackageSearch, Truck } from 'lucide-react'
import { Button, Input } from '../components/ui'

const demoRefs = ['LM-8406', 'LM-8404', 'LM-8402']

export default function TrackOrderPage() {
  const [ref, setRef] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    const v = ref.trim().toUpperCase()
    if (!v) return setError('Enter your order reference, e.g. LM-8406')
    if (!/^LM-\d+$/.test(v)) return setError('Order references look like LM-8406 — check your confirmation email.')
    navigate(`/order/${v}`)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Truck className="size-7" /></div>
        <h1 className="mt-4 font-display text-3xl font-bold text-stone-900">Track your order</h1>
        <p className="mt-2 text-stone-500">Enter the order reference from your confirmation — no account needed.</p>
      </div>

      <form onSubmit={submit} className="mt-8 flex gap-2">
        <Input value={ref} onChange={(e) => { setRef(e.target.value); setError('') }} placeholder="LM-8406" className="font-mono uppercase" aria-label="Order reference" />
        <Button type="submit" className="shrink-0 px-6">Track</Button>
      </form>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Demo orders to inspect</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {demoRefs.map((r) => (
            <button key={r} type="button" onClick={() => navigate(`/order/${r}`)} className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-stone-50 px-4 py-1.5 font-mono text-sm font-semibold text-stone-700 transition hover:border-brand-400 hover:text-brand-700">
              <PackageSearch className="size-3.5" /> {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
