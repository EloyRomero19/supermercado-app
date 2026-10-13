import type { CSSProperties } from 'react'
import type { NewItem } from '../api/items'
import type { Item, RecentItem } from '../api/types'
import { recentKey } from '../lists/listEvents'
import { categoryStyle } from './categoryStyle'

const VISIBLE = 18

type Props = {
  recent: RecentItem[]
  items: Item[]
  onAdd: (item: NewItem) => void
}

/**
 * "Utilizados recientemente": lo que se ha añadido otras veces, para volver a añadirlo con un
 * toque sin buscarlo. No se muestra lo que ya está pendiente en la lista.
 */
export function RecentItems({ recent, items, onAdd }: Props) {
  const pending = new Set(items.filter((item) => !item.checked).map((item) => recentKey(item.productId, item.name)))
  const visible = recent.filter((r) => !pending.has(recentKey(r.productId, r.name))).slice(0, VISIBLE)

  if (visible.length === 0) return null

  return (
    <section className="tile-group">
      <h2 className="group-title">
        <span aria-hidden="true">🕘</span>
        Utilizados recientemente
      </h2>
      <p className="group-hint">Toca para volver a añadirlo a la lista.</p>
      <ul className="tiles">
        {visible.map((r) => {
          const style = categoryStyle(r.categoryName)
          return (
            <li key={recentKey(r.productId, r.name)} className="tile tile-recent" style={{ '--tone': style.color } as CSSProperties}>
              <button
                type="button"
                className="tile-main"
                aria-label={`Añadir ${r.name}`}
                onClick={() => onAdd(r.productId !== null ? { productId: r.productId } : { customName: r.name })}
              >
                <span className="tile-icon" aria-hidden="true">
                  {r.icon ?? style.icon}
                </span>
                <span className="tile-name">{r.name}</span>
              </button>
              <span className="tile-add" aria-hidden="true">
                +
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
