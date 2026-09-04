import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react'
import { Logo } from '../../components/ui'
import { Button, Field, Input } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { API } from '../../lib/settings'

export default function AdminLoginPage() {
  const { isAdmin, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (isAdmin) return <Navigate to="/admin" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-stone-900 px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute" />
      <div className="w-full max-w-sm animate-scale-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link to="/"><Logo dark /></Link>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-stone-300">Admin panel</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-7 shadow-elevated">
          <h1 className="flex items-center gap-2 font-display text-xl font-bold text-stone-900">
            <KeyRound className="size-5 text-brand-600" /> Sign in to manage the store
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">Products, inventory, orders and customers live here.</p>

          {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}

          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@lumen.test" autoComplete="email" />
            </Field>
            <Field label="Password">
              <div className="relative">
                <Input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="pr-11" />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            <Button type="submit" loading={busy} className="w-full py-3">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-xs text-stone-400">
          <p className="flex items-center justify-center gap-1.5 font-bold text-stone-200"><Lock className="size-3.5" /> Demo access</p>
          <p className="mt-1.5 font-mono">{API.DEMO_ADMIN.email} · password <b>{API.DEMO_ADMIN.password}</b></p>
          <p className="mt-1">In production this is Laravel Sanctum token auth, enforced server-side.</p>
        </div>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm font-semibold text-stone-500 hover:text-white">← Back to the storefront</Link>
        </p>
      </div>
    </div>
  )
}
