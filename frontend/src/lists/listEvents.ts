import type { Item, ListDetail, Member, RecentItem } from '../api/types'
import { sortItems } from '../items/sortItems'

/** Lo que se ve de una lista: sus datos, sus productos y los utilizados recientemente. */
export type ListView = { list: ListDetail; items: Item[]; recent: RecentItem[] }

const MAX_RECENT = 30

/** Clave para saber si un producto de la lista y uno de "recientes" son el mismo. */
export function recentKey(productId: number | null, name: string): string {
  return productId !== null ? `p${productId}` : `c${name.trim().toLowerCase()}`
}

/** Pone el producto el primero en "recientes" (sin duplicarlo), como hace el backend al añadirlo. */
export function rememberRecent(recent: RecentItem[], item: Item): RecentItem[] {
  const key = recentKey(item.productId, item.name)
  const entry: RecentItem = {
    productId: item.productId,
    customName: item.productId === null ? item.name : null,
    name: item.name,
    icon: item.icon,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    categoryOrder: item.categoryOrder,
    lastUsedAt: new Date().toISOString(),
  }
  return [entry, ...recent.filter((r) => recentKey(r.productId, r.name) !== key)].slice(0, MAX_RECENT)
}

/** Resultado de aplicar un evento: la vista actualizada, o que la lista ya no es accesible. */
export type EventOutcome = { view: ListView } | { gone: string }

/**
 * Aplica un evento recibido por SSE (los tipos son los de ListEvent.java). Es una función pura:
 * no toca React ni la red, así que se prueba fácilmente y aplicar dos veces el mismo evento
 * da el mismo resultado (importante: también nos llegan los eventos de nuestros propios cambios).
 */
export function applyListEvent(view: ListView, type: string, data: unknown, myUserId: string): EventOutcome {
  const { list, items, recent } = view
  switch (type) {
    case 'item-saved': {
      const item = data as Item
      const isNew = !items.some((i) => i.id === item.id)
      return {
        view: {
          list,
          items: sortItems([...items.filter((i) => i.id !== item.id), item]),
          // Un producto recién añadido (por cualquiera de los miembros) pasa a "recientes"
          recent: isNew ? rememberRecent(recent, item) : recent,
        },
      }
    }
    case 'items-deleted': {
      const ids = new Set((data as { ids: string[] }).ids)
      return { view: { list, items: items.filter((i) => !ids.has(i.id)), recent } }
    }
    case 'list-renamed':
      return { view: { list: { ...list, name: (data as { name: string }).name }, items, recent } }
    case 'invite-code-changed':
      return { view: { list: { ...list, inviteCode: (data as { inviteCode: string }).inviteCode }, items, recent } }
    case 'members-changed': {
      const members = (data as { members: Member[] }).members
      const me = members.find((member) => member.userId === myUserId)
      if (!me) return { gone: 'Ya no eres miembro de esta lista.' }
      // Mi rol puede haber cambiado: si el propietario se va, hereda la lista el miembro más antiguo
      return { view: { list: { ...list, members, myRole: me.role }, items, recent } }
    }
    case 'list-deleted':
      return { gone: 'El propietario ha borrado esta lista.' }
    default:
      // Evento desconocido (p. ej. de una versión más nueva del backend): se ignora
      return { view }
  }
}
