import type { Item } from '../api/types'

/**
 * Mismo orden que el backend: por sección del supermercado (los escritos a mano al final)
 * y luego alfabético en español. Hace falta en el cliente para colocar bien lo que se
 * añade o cambia sin volver a pedir toda la lista.
 */
export function sortItems(items: Item[]): Item[] {
  return [...items].sort(
    (a, b) =>
      (a.categoryOrder ?? Number.MAX_SAFE_INTEGER) - (b.categoryOrder ?? Number.MAX_SAFE_INTEGER) ||
      a.name.localeCompare(b.name, 'es'),
  )
}

/** Agrupa los pendientes por sección, conservando el orden. */
export function groupByCategory(items: Item[]): { category: string; items: Item[] }[] {
  const groups = new Map<string, Item[]>()
  for (const item of items) {
    const category = item.categoryName ?? 'Otros'
    groups.set(category, [...(groups.get(category) ?? []), item])
  }
  return [...groups].map(([category, items]) => ({ category, items }))
}
