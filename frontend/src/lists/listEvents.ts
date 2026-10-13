import type { Item, ListDetail, Member } from '../api/types'
import { sortItems } from '../items/sortItems'

/** Lo que se ve de una lista: sus datos y sus productos. */
export type ListView = { list: ListDetail; items: Item[] }

/** Resultado de aplicar un evento: la vista actualizada, o que la lista ya no es accesible. */
export type EventOutcome = { view: ListView } | { gone: string }

/**
 * Aplica un evento recibido por SSE (los tipos son los de ListEvent.java). Es una función pura:
 * no toca React ni la red, así que se prueba fácilmente y aplicar dos veces el mismo evento
 * da el mismo resultado (importante: también nos llegan los eventos de nuestros propios cambios).
 */
export function applyListEvent(view: ListView, type: string, data: unknown, myUserId: string): EventOutcome {
  const { list, items } = view
  switch (type) {
    case 'item-saved': {
      const item = data as Item
      return { view: { list, items: sortItems([...items.filter((i) => i.id !== item.id), item]) } }
    }
    case 'items-deleted': {
      const ids = new Set((data as { ids: string[] }).ids)
      return { view: { list, items: items.filter((i) => !ids.has(i.id)) } }
    }
    case 'list-renamed':
      return { view: { list: { ...list, name: (data as { name: string }).name }, items } }
    case 'invite-code-changed':
      return { view: { list: { ...list, inviteCode: (data as { inviteCode: string }).inviteCode }, items } }
    case 'members-changed': {
      const members = (data as { members: Member[] }).members
      const me = members.find((member) => member.userId === myUserId)
      if (!me) return { gone: 'Ya no eres miembro de esta lista.' }
      // Mi rol puede haber cambiado: si el propietario se va, hereda la lista el miembro más antiguo
      return { view: { list: { ...list, members, myRole: me.role }, items } }
    }
    case 'list-deleted':
      return { gone: 'El propietario ha borrado esta lista.' }
    default:
      // Evento desconocido (p. ej. de una versión más nueva del backend): se ignora
      return { view }
  }
}
