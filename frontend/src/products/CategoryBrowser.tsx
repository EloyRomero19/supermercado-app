import { useEffect, useState } from 'react'
import { getCategories, getCategoryProducts } from '@/api/products'
import type { Category, Product } from '@/api/types'
import { BottomSheet } from '@/components/BottomSheet'
import { Skeleton } from '@/components/ui/skeleton'
import { categoryDrawingUrl } from './drawings'
import { ProductRow, type CatalogActions } from './ProductRow'

type Props = { catalog: CatalogActions }

/**
 * Secciones del súper como fichas con su dibujo: carrusel horizontal en el móvil (se desliza con el dedo)
 * y una rejilla en escritorio. Al tocar una, sus productos en líneas con Añadir / − 1 +.
 */
export function CategoryBrowser({ catalog }: Props) {
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

  const products = open && loaded?.categoryId === open.id ? loaded.products : null

  if (categories.length === 0) return null

  return (
    <nav aria-labelledby="browse-title">
      <h2 id="browse-title" className="section-title mb-3 text-sm">
        Secciones
      </h2>
      {/* Carrusel: se sale por la derecha a propósito, para que se note que hay más */}
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-7 lg:gap-x-3 lg:gap-y-4 lg:overflow-visible lg:px-0">
        {categories.map((category) => {
          return (
            <li key={category.id} className="w-[5.25rem] shrink-0 snap-start lg:w-auto">
              <button
                type="button"
                onClick={() => setOpen(category)}
                className="group flex w-full flex-col items-center gap-1.5 rounded-lg p-0.5 text-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span className="grid aspect-square w-full place-items-center rounded-lg border-2 border-border p-2.5 transition-colors duration-150 group-hover:border-primary" aria-hidden="true">
                  <img src={categoryDrawingUrl(category.name)} alt="" decoding="async" draggable={false} className="size-full transition-transform duration-200 group-hover:-rotate-6" />
                </span>
                <span className="line-clamp-2 text-xs leading-tight font-semibold">{category.name}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <BottomSheet open={open !== null} onClose={() => setOpen(null)} title={open?.name ?? ''} description={products ? `${products.length} productos` : 'Cargando productos'}>
        {products === null ? (
          <div className="flex flex-col divide-y" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex h-[4.5rem] items-center gap-3">
                <Skeleton className="size-14 rounded-lg" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-11 w-[7.5rem] rounded-full" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay productos que mostrar en esta sección.</p>
        ) : (
          <ul className="-mt-2 flex flex-col divide-y">
            {products.map((product) => (
              <ProductRow key={product.id} product={product} catalog={catalog} showCategory={false} />
            ))}
          </ul>
        )}
      </BottomSheet>
    </nav>
  )
}
