import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { NewItem } from '@/api/items'
import type { Item, RecentItem } from '@/api/types'
import { ProductTile } from '@/components/ProductTile'
import { Button } from '@/components/ui/button'
import { recentKey } from '@/lists/listEvents'
import { tileTransitionName } from '@/lib/viewTransition'

/** Cuántas se ven de entrada; el resto, con «Ver todas». 12 llena filas enteras con 3, 4 y 6 columnas. */
const VISIBLE = 12

type Props = {
  recent: RecentItem[]
  /** Lo pendiente: eso no se repite aquí */
  items: Item[]
  onAdd: (item: NewItem) => void
}

/**
 * Lo que se ha añadido otras veces, en fichas azules del mismo tamaño que las de lo que falta: un
 * toque y vuelve a la lista (la ficha viaja arriba y se vuelve teja). Lo más reciente primero.
 */
export function RecentItems({ recent, items, onAdd }: Props) {
  const [expanded, setExpanded] = useState(false)
  const pending = new Set(items.map((item) => recentKey(item.productId, item.name)))
  const available = recent.filter((r) => !pending.has(recentKey(r.productId, r.name)))
  const visible = expanded ? available : available.slice(0, VISIBLE)

  if (available.length === 0) return null

  return (
    <section aria-labelledby="recent-title">
      <h2 id="recent-title" className="section-title mb-3 text-base">
        Otras veces
      </h2>
      <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
        {visible.map((r) => (
          <ProductTile
            key={recentKey(r.productId, r.name)}
            tone="stock"
            name={r.name}
            categoryName={r.categoryName}
            label={`Añadir ${r.name} a la lista`}
            transitionName={tileTransitionName(r.productId, r.name)}
            onClick={() => onAdd(r.productId !== null ? { productId: r.productId } : { customName: r.name })}
          />
        ))}
      </ul>
      {available.length > VISIBLE && (
        <Button variant="ghost" className="mt-1 h-11 px-1 text-primary hover:bg-transparent hover:underline" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          {expanded ? 'Ver menos' : `Ver todas (${available.length})`}
          <ChevronDown className={expanded ? 'rotate-180' : undefined} aria-hidden="true" />
        </Button>
      )}
    </section>
  )
}
