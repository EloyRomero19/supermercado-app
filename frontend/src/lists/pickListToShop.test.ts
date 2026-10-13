import { describe, expect, it } from 'vitest'
import type { ListSummary } from '../api/types'
import { pickListToShop } from './pickListToShop'

const list = (id: string, itemCount: number, checkedCount = 0): ListSummary => ({
  id, name: id, myRole: 'OWNER', memberCount: 1, itemCount, checkedCount,
})

describe('pickListToShop', () => {
  const lists = [list('casa', 3), list('playa', 10, 2), list('vacia', 0)]

  it('abre la última lista usada si sigue siendo nuestra', () => {
    expect(pickListToShop(lists, 'casa')?.id).toBe('casa')
  })

  it('si no hay última (o ya no existe), la que tiene más cosas por comprar', () => {
    expect(pickListToShop(lists, null)?.id).toBe('playa')
    expect(pickListToShop(lists, 'lista-borrada')?.id).toBe('playa')
  })

  it('sin listas no hay nada que abrir', () => {
    expect(pickListToShop([], 'casa')).toBeNull()
  })
})
