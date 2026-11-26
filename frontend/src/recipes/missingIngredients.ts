import type { Ingredient, Item } from '@/api/types'

/** Separa los ingredientes de una receta en los que ya están en la lista y los que faltan. */
export function splitIngredients(ingredients: Ingredient[], items: Item[]): { inList: Ingredient[]; missing: Ingredient[] } {
  const pending = new Set(items.filter((item) => item.productId !== null).map((item) => item.productId))
  return {
    inList: ingredients.filter((ingredient) => pending.has(ingredient.productId)),
    missing: ingredients.filter((ingredient) => !pending.has(ingredient.productId)),
  }
}

/** Nota que acompaña al producto en la lista: cuánto hace falta y para qué receta. */
export function ingredientNote(ingredient: Ingredient, recipeName: string): string {
  return ingredient.amount === 'al gusto' ? recipeName : `${ingredient.amount} · ${recipeName}`
}
