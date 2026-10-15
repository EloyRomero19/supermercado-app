import { describe, expect, it } from 'vitest'
import type { Item, ListDetail, Member } from '../api/types'
import { applyListEvent, type ListView } from './listEvents'

const ana: Member = { userId: 'ana', displayName: 'Ana', role: 'OWNER' }
const beto: Member = { userId: 'beto', displayName: 'Beto', role: 'MEMBER' }
const list: ListDetail = { id: 'l1', name: 'Casa', inviteCode: 'ABCD2345', myRole: 'MEMBER', members: [ana, beto] }

function item(id: string, name: string, checked = false): Item {
  return {
    id, productId: null, name, icon: null, categoryId: null, categoryName: null, categoryOrder: null, quantity: 1, note: null,
    checked, checkedByName: null, checkedAt: null, addedByName: null, createdAt: '',
  }
}

const view: ListView = { list, items: [item('1', 'Pilas'), item('2', 'Velas')], recent: [] }
const viewOf = (outcome: ReturnType<typeof applyListEvent>) => ('view' in outcome ? outcome.view : null)

describe('applyListEvent', () => {
  it('añade un producto nuevo en su sitio y reemplaza uno existente', () => {
    const added = viewOf(applyListEvent(view, 'item-saved', item('3', 'Azúcar'), 'beto'))
    expect(added?.items.map((i) => i.name)).toEqual(['Azúcar', 'Pilas', 'Velas'])

    const checked = viewOf(applyListEvent(view, 'item-saved', item('1', 'Pilas', true), 'beto'))
    expect(checked?.items).toHaveLength(2)
    expect(checked?.items.find((i) => i.id === '1')?.checked).toBe(true)
  })

  it('aplicar dos veces el mismo evento no duplica nada', () => {
    const once = viewOf(applyListEvent(view, 'item-saved', item('3', 'Azúcar'), 'beto'))!
    const twice = viewOf(applyListEvent(once, 'item-saved', item('3', 'Azúcar'), 'beto'))
    expect(twice).toEqual(once)
  })

  it('borra solo los productos indicados', () => {
    const result = viewOf(applyListEvent(view, 'items-deleted', { ids: ['1', 'no-existe'] }, 'beto'))
    expect(result?.items.map((i) => i.id)).toEqual(['2'])
  })

  it('actualiza nombre y código de invitación', () => {
    const renamed = viewOf(applyListEvent(view, 'list-renamed', { name: 'Piso' }, 'beto'))
    expect(renamed?.list.name).toBe('Piso')
    const recoded = viewOf(applyListEvent(view, 'invite-code-changed', { inviteCode: 'ZZZZ9999' }, 'beto'))
    expect(recoded?.list.inviteCode).toBe('ZZZZ9999')
  })

  it('al heredar la lista, mi rol pasa a propietario', () => {
    const result = viewOf(applyListEvent(view, 'members-changed', { members: [{ ...beto, role: 'OWNER' }] }, 'beto'))
    expect(result?.list.myRole).toBe('OWNER')
    expect(result?.list.members).toHaveLength(1)
  })

  it('si ya no estoy entre los miembros o la lista se borra, la lista deja de estar disponible', () => {
    expect(applyListEvent(view, 'members-changed', { members: [ana] }, 'beto')).toEqual({
      gone: 'Ya no eres miembro de esta lista.',
    })
    expect(applyListEvent(view, 'list-deleted', {}, 'beto')).toHaveProperty('gone')
  })

  it('ignora eventos desconocidos', () => {
    expect(viewOf(applyListEvent(view, 'algo-nuevo', {}, 'beto'))).toBe(view)
  })

  it('lo que se añade pasa a "recientes" el primero y sin duplicados; los cambios de estado no', () => {
    const added = viewOf(applyListEvent(view, 'item-saved', item('3', 'Azúcar'), 'beto'))!
    expect(added.recent.map((r) => r.name)).toEqual(['Azúcar'])

    const again = viewOf(applyListEvent({ ...added, items: [] }, 'item-saved', item('4', 'azúcar '), 'beto'))!
    expect(again.recent.map((r) => r.name)).toEqual(['azúcar '])

    const checked = viewOf(applyListEvent(added, 'item-saved', item('3', 'Azúcar', true), 'beto'))!
    expect(checked.recent).toBe(added.recent)
  })
})
