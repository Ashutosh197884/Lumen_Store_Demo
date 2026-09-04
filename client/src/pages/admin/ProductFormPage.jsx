import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Save } from 'lucide-react'
import { api } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { Button, Field, GradientTile, Input, Loader, PageHeader, Select, Textarea } from '../../components/ui'
import { CATEGORIES } from '../../data/seedProducts'
import { cx } from '../../lib/cx'

const EMOJI_CHOICES = ['🎧', '🎵', '🔊', '⌚', '🏃', '💍', '💡', '🕯️', '🧺', '☕', '🍳', '🍶', '🎒', '🕶️', '🥤', '🔌', '📦', '🎁', '🧴', '🛋️', '🖥️', '📱']
const BADGE_CHOICES = ['Best Seller', 'New', 'Limited', 'Organic', 'Sale']

const empty = {
  name: '', category: 'audio', price: '', compareAt: '', stock: '10', sku: '', unit: 'each',
  emoji: '📦', description: '', featuresText: 'Free returns within 30 days\n1-year warranty\nFast, tracked shipping', badges: [], active: true,
}

export default function ProductFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { data: existing, loading } = useFetch(() => (editing ? api.products.get(id) : Promise.resolve(null)), [id])

  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (existing) {
      setForm({
        ...empty,
        ...existing,
        price: existing.price,
        compareAt: existing.compareAt ?? '',
        stock: existing.stock,
        featuresText: (existing.features || []).join('\n'),
      })
    }
  }, [existing])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggleBadge = (b) =>
    setForm((f) => ({ ...f, badges: f.badges.includes(b) ? f.badges.filter((x) => x !== b) : [...f.badges, b] }))

  const preview = {
    ...form,
    id: existing?.id || 'preview',
    price: Number(form.price) || 0,
    compareAt: Number(form.compareAt) || null,
    stock: Number(form.stock) || 0,
    name: form.name || 'Product name',
    features: [],
  }

  const save = async (e) => {
    e.preventDefault()
    setSaveError('')
    if (!form.name.trim()) return setSaveError('Product name is required.')
    if (Number(form.price) < 0 || form.price === '') return setSaveError('Enter a price (0 is allowed).')

    setSaving(true)
    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      compareAt: form.compareAt ? Number(form.compareAt) : null,
      stock: Number(form.stock) || 0,
      unit: form.unit,
      emoji: form.emoji,
      sku: form.sku,
      description: form.description,
      features: form.featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
      badges: form.badges,
      active: form.active,
    }
    try {
      if (editing) await api.products.update(id, payload)
      else await api.products.create(payload)
      navigate('/admin/products')
    } catch (err) {
      setSaveError(err.message)
      setSaving(false)
    }
  }

  if (editing && loading) return <Loader label="Loading product…" />

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-stone-500 hover:text-stone-900">
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <PageHeader title={editing ? `Edit ${existing?.name || ''}` : 'Add product'} subtitle="Changes appear on the storefront immediately." />

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="font-display text-base font-bold text-stone-900">Details</h2>
            <div className="mt-4 space-y-4">
              <Field label="Product name" error={saveError && !form.name ? saveError : null}>
                <Input value={form.name} onChange={set('name')} placeholder="e.g. Ceramic Pour-over Set" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category">
                  <Select value={form.category} onChange={set('category')}>
                    {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </Select>
                </Field>
                <Field label="SKU" hint="Leave blank to auto-generate"><Input value={form.sku} onChange={set('sku')} placeholder="LM-1001" /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Price (USD)" error={saveError && !(Number(form.price) >= 0) ? saveError : null}>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="49.00" />
                </Field>
                <Field label="Compare-at price" hint="Shows a strikethrough">
                  <Input type="number" min="0" step="0.01" value={form.compareAt} onChange={set('compareAt')} placeholder="59.00" />
                </Field>
                <Field label="Stock on hand">
                  <Input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} />
                </Field>
              </div>
              <Field label="Description" hint="Shown on the product page">
                <Textarea rows={3} value={form.description} onChange={set('description')} placeholder="What makes this product worth it?" />
              </Field>
              <Field label="Feature bullets" hint="One per line — shown under the description">
                <Textarea rows={4} value={form.featuresText} onChange={set('featuresText')} />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="font-display text-base font-bold text-stone-900">Presentation</h2>
            <div className="mt-4 space-y-5">
              <div>
                <p className={cx('mb-1.5 text-sm font-semibold text-stone-700')}>Product artwork (placeholder art)</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_CHOICES.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, emoji: em }))}
                      className={cx('grid size-11 place-items-center rounded-xl border text-2xl transition', form.emoji === em ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-stone-200 bg-white hover:border-stone-300')}
                      aria-label={`Use ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-stone-400">In production, the admin panel uploads real photos to the <code className="rounded bg-stone-100 px-1">product_images</code> table.</p>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-stone-700">Badges</p>
                <div className="flex flex-wrap gap-2">
                  {BADGE_CHOICES.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBadge(b)}
                      className={cx('rounded-full border px-3.5 py-1.5 text-xs font-bold transition', form.badges.includes(b) ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white text-stone-600 hover:border-stone-500')}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
            <h2 className="font-display text-base font-bold text-stone-900">Availability</h2>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-stone-800">List on storefront</p>
                <p className="text-xs text-stone-400">Hidden products stay in the admin but never appear in the shop.</p>
              </div>
              <button type="button" role="switch" aria-checked={form.active} onClick={() => setForm((f) => ({ ...f, active: !f.active }))} className={cx('relative h-7 w-12 shrink-0 rounded-full transition', form.active ? 'bg-brand-600' : 'bg-stone-300')}>
                <span className={cx('absolute top-1 size-5 rounded-full bg-white shadow transition-all', form.active ? 'left-6' : 'left-1')} />
              </button>
            </div>
          </section>

          {saveError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{saveError}</div>}
        </div>

        {/* Preview rail */}
        <div className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
            <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-stone-400">
              <Eye className="size-3.5" /> Live preview
            </div>
            <div className="p-4">
              <GradientTile product={preview} className="aspect-square rounded-xl" tileClassName="text-7xl" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-stone-400">{CATEGORIES.find((c) => c.slug === form.category)?.name || 'Category'}</p>
              <p className="mt-1 truncate font-display font-bold text-stone-900">{form.name || 'Product name'}</p>
              <p className="text-lg font-bold text-stone-900 tabular-nums">${Number(form.price) || 0}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={saving} className="flex-1 py-3">
              <Save className="size-4" /> {editing ? 'Save changes' : 'Create product'}
            </Button>
            <Link to="/admin/products" className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50">
              Cancel
            </Link>
          </div>
          <p className="text-center text-xs text-stone-400">
            {editing ? 'Saving updates' : 'Creating'} via <code className="rounded bg-stone-100 px-1">{editing ? 'PUT /api/products/:id' : 'POST /api/products'}</code>
          </p>
        </div>
      </form>
    </div>
  )
}
