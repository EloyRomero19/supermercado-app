import { describe, expect, it } from 'vitest'
import type { Ingredient, Item } from '@/api/types'
import { ingredientNote, splitIngredients } from './missingIngredients'

const ingredient = (productId: number, name: string, amount = '1'): Ingredient => ({
  productId, name, icon: '🥔', categoryId: 1, categoryName: 'Frutas y verduras', categoryOrder: 1, amount,
})
const item = (productId: number | null, checked = false): Item => ({
  id: String(productId), productId, name: 'x', icon: null, categoryId: null, categoryName: null, categoryOrder: null,
  quantity: 1, note: null, checked, checkedByName: null, checkedAt: null, addedByName: null, createdAt: '',
})

describe('splitIngredients', () => {
  const ingredients = [ingredient(1, 'Patata'), ingredient(2, 'Huevos'), ingredient(3, 'Cebolla')]

  it('lo pendiente en la lista ya lo tienes; lo demás falta', () => {
    const { inList, missing } = splitIngredients(ingredients, [item(2), item(99)])
    expect(inList.map((i) => i.name)).toEqual(['Huevos'])
    expect(missing.map((i) => i.name)).toEqual(['Patata', 'Cebolla'])
  })

  it('lo que ya está en el carrito hay que volver a comprarlo', () => {
    expect(splitIngredients(ingredients, [item(1, true)]).missing).toHaveLength(3)
  })
})

describe('ingredientNote', () => {
  it('incluye la cantidad salvo que sea "al gusto"', () => {
    expect(ingredientNote(ingredient(1, 'Patata', '1 kg'), 'Tortilla de patatas')).toBe('1 kg · Tortilla de patatas')
    expect(ingredientNote(ingredient(9, 'Sal', 'al gusto'), 'Tortilla de patatas')).toBe('Tortilla de patatas')
  })
})
