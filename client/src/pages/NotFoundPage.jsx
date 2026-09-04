import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <p className="font-display text-7xl font-bold text-brand-200">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-stone-900">Page not found</h1>
      <p className="mt-2 text-stone-500">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700">
        Back to the store
      </Link>
    </div>
  )
}
