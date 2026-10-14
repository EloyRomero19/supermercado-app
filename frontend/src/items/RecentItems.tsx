import { History, Plus } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { NewItem } from '@/api/items'
import type { Item, RecentItem } from '@/api/types'
import { recentKey } from '@/lists/listEvents'
import { categoryStyle } from './categoryStyle'

const VISIBLE = 18

type Props = {
  recent: RecentItem[]
  items: Item[]
  onAdd: (item: NewItem) => void
}

/**
 * "Utilizados recientemente": lo que se ha añadido otras veces, para volver a añadirlo con un
 * toque sin buscarlo. No se muestra lo que ya está pendiente en la lista. En una fila con scroll
 * horizontal para no alargar la página.
 */
export function RecentItems({ recent, items, onAdd }: Props) {
  const pending = new Set(items.filter((item) => !item.checked).map((item) => recentKey(item.productId, item.name)))
  const visible = recent.filter((r) => !pending.has(recentKey(r.productId, r.name))).slice(0, VISIBLE)

  if (visible.length === 0) return null

  return (
    <section aria-labelledby="recent-title">
      <h2 id="recent-title" className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-muted-foreground">
        <History className="size-4" aria-hidden="true" />
        Utilizados recientemente
      </h2>
      {/* -mx-4 px-4: la fila llega hasta el borde de la pantalla al desplazarse */}
      <ul className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {visible.map((r) => {
          const style = categoryStyle(r.categoryName)
          return (
            <li key={recentKey(r.productId, r.name)} className="w-24 shrink-0 snap-start" style={{ '--tone': style.color } as CSSProperties}>
              <button
                type="button"
                aria-label={`Añadir ${r.name}`}
                onClick={() => onAdd(r.productId !== null ? { productId: r.productId } : { customName: r.name })}
                className="relative flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-card p-2 text-center outline-none transition-transform hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95"
              >
                <span className="text-3xl leading-none" aria-hidden="true">
                  {r.icon ?? style.icon}
                </span>
                <span className="line-clamp-2 text-xs leading-tight font-medium">{r.name}</span>
                <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-(--tone) text-on-tone" aria-hidden="true">
                  <Plus className="size-3.5" strokeWidth={3} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
