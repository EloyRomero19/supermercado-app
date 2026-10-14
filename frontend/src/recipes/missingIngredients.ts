import type { Ingredient, Item } from '@/api/types'

/**
 * Separa los ingredientes de una receta en los que ya están pendientes en la lista y los que
 * faltan. Lo que ya está en el carrito cuenta como "falta": hay que volver a comprarlo.
 */
export function splitIngredients(ingredients: Ingredient[], items: Item[]): { inList: Ingredient[]; missing: Ingredient[] } {
  const pending = new Set(items.filter((item) => !item.checked && item.productId !== null).map((item) => item.productId))
  return {
    inList: ingredients.filter((ingredient) => pending.has(ingredient.productId)),
    missing: ingredients.filter((ingredient) => !pending.has(ingredient.productId)),
  }
}

/** Nota que acompaña al producto en la lista: cuánto hace falta y para qué receta. */
export function ingredientNote(ingredient: Ingredient, recipeName: string): string {
  return ingredient.amount === 'al gusto' ? recipeName : `${ingredient.amount} · ${recipeName}`
}
