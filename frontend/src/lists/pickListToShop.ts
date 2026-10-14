import type { ListSummary } from '../api/types'

/**
 * La lista "principal": la que abre la pestaña Listas y a la que añaden las recetas por defecto.
 * La última abierta si sigue siendo nuestra; si no, la que tenga más productos por comprar.
 * null si no hay ninguna lista.
 */
export function pickListToShop(lists: ListSummary[], lastListId: string | null): ListSummary | null {
  const last = lists.find((list) => list.id === lastListId)
  if (last) return last
  const pending = (list: ListSummary) => list.itemCount - list.checkedCount
  return [...lists].sort((a, b) => pending(b) - pending(a))[0] ?? null
}
