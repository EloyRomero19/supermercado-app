import type { Product } from '@/api/types'
import { ProductDrawing } from '@/components/ProductDrawing'
import { QuantityStepper } from '@/components/QuantityStepper'

/** Lo que se puede hacer con un producto del catálogo desde el buscador o las secciones. */
export type CatalogActions = {
  /** Cantidad pendiente de ese producto en la lista (0 si no está) */
  quantityOf: (productId: number) => number
  add: (product: Product) => void
  /** Quita una unidad (o el producto, si solo había una) */
  removeOne: (product: Product) => void
}

type Props = { product: Product; catalog: CatalogActions; showCategory?: boolean }

/** Una línea de producto como en una tienda: dibujo, nombre (máx. 2 líneas) y Añadir / − 1 +. */
export function ProductRow({ product, catalog, showCategory = true }: Props) {
  return (
    <li className="flex min-h-[4.5rem] items-center gap-3 py-2">
      <ProductDrawing name={product.name} categoryName={product.categoryName} size="md" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="line-clamp-2 leading-snug font-semibold">{product.name}</span>
        {showCategory && <span className="truncate text-sm text-muted-foreground">{product.categoryName}</span>}
      </span>
      <QuantityStepper
        name={product.name}
        quantity={catalog.quantityOf(product.id)}
        onAdd={() => catalog.add(product)}
        onRemove={() => catalog.removeOne(product)}
      />
    </li>
  )
}
