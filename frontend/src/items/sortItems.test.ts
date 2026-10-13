import { describe, expect, it } from 'vitest'
import type { Item } from '../api/types'
import { groupByCategory, sortItems } from './sortItems'

function item(name: string, categoryName: string | null, categoryOrder: number | null): Item {
  return {
    id: name, productId: null, name, icon: null, categoryId: null, categoryName, categoryOrder, quantity: 1, note: null,
    checked: false, checkedByName: null, checkedAt: null, addedByName: null, createdAt: '',
  }
}

describe('sortItems', () => {
  it('ordena por sección, deja los escritos a mano al final y usa el orden alfabético español', () => {
    const sorted = sortItems([
      item('Pilas', null, null),
      item('Detergente', 'Limpieza', 11),
      item('Ñora', 'Frutas y verduras', 1),
      item('Nabo', 'Frutas y verduras', 1),
      item('Ajo', 'Frutas y verduras', 1),
    ])
    expect(sorted.map((i) => i.name)).toEqual(['Ajo', 'Nabo', 'Ñora', 'Detergente', 'Pilas'])
  })

  it('agrupa por sección y llama "Otros" a lo que no tiene', () => {
    const groups = groupByCategory(sortItems([item('Pilas', null, null), item('Ajo', 'Frutas y verduras', 1)]))
    expect(groups.map((g) => g.category)).toEqual(['Frutas y verduras', 'Otros'])
  })
})
