import { useEffect, useState, type CSSProperties } from 'react'
import { getCategories, getCategoryProducts } from '../api/products'
import type { Category, Item, Product } from '../api/types'
import { Sheet } from '../components/Sheet'
import { categoryStyle } from '../items/categoryStyle'

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
    <section className="card">
      <h2>Explorar por secciones</h2>
      <ul className="category-grid">
        {categories.map((category) => {
          const style = categoryStyle(category.name)
          return (
            <li key={category.id}>
              <button
                type="button"
                className="category-tile"
                style={{ '--tone': style.color } as CSSProperties}
                onClick={() => setOpen(category)}
              >
                <span className="category-tile-icon" aria-hidden="true">
                  {style.icon}
                </span>
                <span>{category.name}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <Sheet open={open !== null} onClose={() => setOpen(null)} title={open?.name ?? ''}>
        <p className="muted">Toca un producto para añadirlo a la lista.</p>
        {products === null ? (
          <div className="skeleton" aria-busy="true" />
        ) : (
          <ul className="tiles">
            {products.map((product) => {
              const quantity = pendingQuantity.get(product.id)
              return (
                <li
                  key={product.id}
                  className={quantity ? 'tile tile-added' : 'tile'}
                  style={{ '--tone': categoryStyle(product.categoryName).color } as CSSProperties}
                >
                  <button
                    type="button"
                    className="tile-main"
                    aria-label={`Añadir ${product.name}${quantity ? ` (ya hay ${quantity} en la lista)` : ''}`}
                    onClick={() => onAdd(product)}
                  >
                    <span className="tile-icon" aria-hidden="true">
                      {product.icon}
                    </span>
                    <span className="tile-name">{product.name}</span>
                  </button>
                  {quantity && <span className="tile-quantity">{quantity > 1 ? `×${quantity}` : '✓'}</span>}
                </li>
              )
            })}
          </ul>
        )}
      </Sheet>
    </section>
  )
}
