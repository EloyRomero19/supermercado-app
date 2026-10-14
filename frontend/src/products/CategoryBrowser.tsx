import { Check, LayoutGrid } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { getCategories, getCategoryProducts } from '@/api/products'
import type { Category, Item, Product } from '@/api/types'
import { TilesSkeleton } from '@/components/AppSkeleton'
import { BottomSheet } from '@/components/BottomSheet'
import { categoryStyle } from '@/items/categoryStyle'
import { cn } from '@/lib/utils'

type Props = {
  /** Productos de la lista, para marcar los que ya están pendientes */
  items: Item[]
  onAdd: (product: Product) => void
}

/** "Explorar por secciones": las secciones del súper y, al tocar una, sus productos en tarjetas. */
export function CategoryBrowser({ items, onAdd }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [open, setOpen] = useState<Category | null>(null)
  const [loaded, setLoaded] = useState<{ categoryId: number; products: Product[] } | null>(null)

  useEffect(() => {
    let ignore = false
    getCategories()
      .then((result) => !ignore && setCategories(result))
      .catch(() => {
        // sin secciones no se muestra el explorador; el buscador sigue funcionando
      })
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!open) return
    let ignore = false
    getCategoryProducts(open.id)
      .then((products) => !ignore && setLoaded({ categoryId: open.id, products }))
      .catch(() => !ignore && setLoaded({ categoryId: open.id, products: [] }))
    return () => {
      ignore = true
    }
  }, [open])

  // Cantidad pendiente de cada producto del catálogo que ya está en la lista
  const pendingQuantity = new Map(
    items.filter((item) => !item.checked && item.productId !== null).map((item) => [item.productId, item.quantity]),
  )
  const products = open && loaded?.categoryId === open.id ? loaded.products : null

  if (categories.length === 0) return null

  return (
    <section aria-labelledby="browse-title">
      <h2 id="browse-title" className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-muted-foreground">
        <LayoutGrid className="size-4" aria-hidden="true" />
        Explorar por secciones
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2.5">
        {categories.map((category) => {
          const style = categoryStyle(category.name)
          return (
            <li key={category.id} style={{ '--tone': style.color } as CSSProperties}>
              <button
                type="button"
                onClick={() => setOpen(category)}
                className="flex min-h-24 w-full flex-col items-center justify-center gap-1.5 rounded-xl bg-tone-soft p-2 text-center text-xs leading-tight font-semibold text-(--tone) outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95"
              >
                <span className="text-3xl leading-none" aria-hidden="true">
                  {style.icon}
                </span>
                {category.name}
              </button>
            </li>
          )
        })}
      </ul>

      <BottomSheet open={open !== null} onClose={() => setOpen(null)} title={open?.name ?? ''} description="Toca un producto para añadirlo a la lista.">
        {products === null ? (
          <TilesSkeleton count={9} />
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2.5">
            {products.map((product) => {
              const quantity = pendingQuantity.get(product.id)
              return (
                <li key={product.id} className="relative" style={{ '--tone': categoryStyle(product.categoryName).color } as CSSProperties}>
                  <button
                    type="button"
                    aria-label={`Añadir ${product.name}${quantity ? ` (ya hay ${quantity} en la lista)` : ''}`}
                    onClick={() => onAdd(product)}
                    className={cn(
                      'flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 bg-tone-soft p-2 text-center outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95',
                      quantity ? 'border-(--tone)' : 'border-tone-soft',
                    )}
                  >
                    <span className="text-4xl leading-none" aria-hidden="true">
                      {product.icon}
                    </span>
                    <span className="line-clamp-2 text-sm leading-tight font-semibold">{product.name}</span>
                  </button>
                  {quantity && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-2 left-2 grid h-6 min-w-6 place-items-center rounded-full bg-(--tone) px-1.5 text-xs font-bold text-on-tone motion-safe:animate-pop"
                    >
                      {quantity > 1 ? `×${quantity}` : <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </BottomSheet>
    </section>
  )
}
