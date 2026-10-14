import { ChevronDown, History, Plus } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import type { NewItem } from '@/api/items'
import type { Item, RecentItem } from '@/api/types'
import { Button } from '@/components/ui/button'
import { recentKey } from '@/lists/listEvents'
import { categoryStyle } from './categoryStyle'

/** Cuántos se ven de entrada (4 filas de 3 en el móvil); el resto, con «Ver todos». */
const VISIBLE = 12

type Props = {
  recent: RecentItem[]
  items: Item[]
  onAdd: (item: NewItem) => void
}

/**
 * "Utilizados recientemente": lo que se ha añadido otras veces, para volver a añadirlo con un
 * toque sin buscarlo. No se muestra lo que ya está pendiente en la lista. En cuadrícula (como las
 * tarjetas de la lista), los más recientes primero, para verlos todos de un vistazo.
 */
export function RecentItems({ recent, items, onAdd }: Props) {
  const pending = new Set(items.filter((item) => !item.checked).map((item) => recentKey(item.productId, item.name)))
  const available = recent.filter((r) => !pending.has(recentKey(r.productId, r.name)))
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? available : available.slice(0, VISIBLE)

  if (available.length === 0) return null

  return (
    <section aria-labelledby="recent-title">
      <h2 id="recent-title" className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-muted-foreground">
        <History className="size-4" aria-hidden="true" />
        Utilizados recientemente
        <span className="rounded-full bg-muted px-2 text-xs font-semibold tabular-nums">{available.length}</span>
      </h2>
      <p className="mb-2 px-1 text-xs text-muted-foreground">Toca uno para volver a añadirlo a la lista.</p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2.5">
        {visible.map((r) => {
          const style = categoryStyle(r.categoryName)
          return (
            <li key={recentKey(r.productId, r.name)} className="motion-safe:animate-tile-in" style={{ '--tone': style.color } as CSSProperties}>
              <button
                type="button"
                aria-label={`Añadir ${r.name}`}
                onClick={() => onAdd(r.productId !== null ? { productId: r.productId } : { customName: r.name })}
                className="relative flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed bg-card p-2 pt-5 text-center outline-none transition-transform hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95"
              >
                <span className="text-4xl leading-none" aria-hidden="true">
                  {r.icon ?? style.icon}
                </span>
                <span className="line-clamp-2 text-sm leading-tight font-medium">{r.name}</span>
                <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-(--tone) text-on-tone" aria-hidden="true">
                  <Plus className="size-4" strokeWidth={3} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {available.length > VISIBLE && (
        <Button variant="ghost" className="mt-2 h-11 w-full text-muted-foreground" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          {expanded ? 'Ver menos' : `Ver todos (${available.length})`}
          <ChevronDown className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} aria-hidden="true" />
        </Button>
      )}
    </section>
  )
}
