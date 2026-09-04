import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { GradientTile, Price, Rating, Badge, Pill } from './ui'
import { useCart } from '../context/CartContext'
import { CATEGORY_MAP } from '../data/seedProducts'

export default function ProductCard({ product }) {
  const { add } = useCart()
  const out = product.stock === 0

  return (
    <Link
      to={`/product/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative aspect-square">
        {product.badges?.length > 0 && <Badge>{product.badges[0]}</Badge>}
        <GradientTile product={product} className="h-full" />
        {out && (
          <div className="absolute inset-0 grid place-items-center bg-stone-900/40 backdrop-blur-[1px]">
            <span className="rounded-full bg-stone-900/80 px-4 py-1 text-xs font-bold text-white">Sold out</span>
          </div>
        )}
        {!out && (
          <button
            type="button"
            aria-label={`Add ${product.name} to cart`}
            onClick={(e) => {
              e.preventDefault()
              add(product, 1)
            }}
            className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-white text-stone-800 shadow-lg transition hover:bg-brand-600 hover:text-white group-hover:scale-105"
          >
            <Plus className="size-5" />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <Pill tone="gray">{CATEGORY_MAP[product.category]?.name || product.category}</Pill>
          {product.compareAt && <span className="text-xs text-stone-400 line-through">{`$${product.compareAt}`}</span>}
        </div>
        <h3 className="font-display text-[15px] font-semibold leading-snug text-stone-900 group-hover:text-brand-700">
          {product.name}
        </h3>
        <Rating value={product.rating} reviews={product.reviews} />
        <div className="mt-auto pt-2">
          <Price amount={product.price} size="md" />
        </div>
      </div>
    </Link>
  )
}
