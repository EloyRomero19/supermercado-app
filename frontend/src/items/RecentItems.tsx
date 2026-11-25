import { ChevronDown, Plus } from 'lucide-react'
import { ProductDrawing } from '@/components/ProductDrawing'
import { useState } from 'react'
import type { NewItem } from '@/api/items'
import type { Item, RecentItem } from '@/api/types'
import { Button } from '@/components/ui/button'
import { recentKey } from '@/lists/listEvents'

/** Cuántos se ven de entrada; el resto, con «Ver todos». */
const VISIBLE = 12

type Props = {
  recent: RecentItem[]
  items: Item[]
  onAdd: (item: NewItem) => void
}

/**
 * "Añadidos recientemente" (antes "Utilizados recientemente"): lo que se ha añadido otras veces, para volver a añadirlo con un
 * toque sin buscarlo. No se muestra lo que ya está pendiente en la lista. Como fichas pequeñas, los
 * más recientes primero: caben muchos sin empujar hacia abajo el resto de la página.
 */
export function RecentItems({ recent, items, onAdd }: Props) {
  const pending = new Set(items.filter((item) => !item.checked).map((item) => recentKey(item.productId, item.name)))
  const available = recent.filter((r) => !pending.has(recentKey(r.productId, r.name)))
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? available : available.slice(0, VISIBLE)

  if (available.length === 0) return null

  return (
    <section aria-labelledby="recent-title">
      <h2 id="recent-title" className="section-title mb-3 text-sm">
        Otras veces habéis comprado
      </h2>
      <ul className="flex flex-wrap gap-2">
        {visible.map((r) => (
          <li key={recentKey(r.productId, r.name)}>
            <button
              type="button"
              aria-label={`Añadir ${r.name}`}
              onClick={() => onAdd(r.productId !== null ? { productId: r.productId } : { customName: r.name })}
              className="flex h-12 max-w-[17rem] items-center gap-2 rounded-full border-2 border-border pr-4 pl-1.5 text-sm font-semibold outline-none transition-colors duration-150 hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/60"
            >
              <ProductDrawing name={r.name} categoryName={r.categoryName} size="xs" />
              <span className="truncate">{r.name}</span>
              <Plus className="size-4 shrink-0 text-primary" strokeWidth={2.75} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      {available.length > VISIBLE && (
        <Button variant="ghost" className="mt-1 h-11 px-1 text-primary hover:bg-transparent hover:underline" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          {expanded ? 'Ver menos' : `Ver todos (${available.length})`}
          <ChevronDown className={expanded ? 'rotate-180' : undefined} aria-hidden="true" />
        </Button>
      )}
    </section>
  )
}
