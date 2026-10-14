import { api } from './client'
import type { RecipeDetail, RecipeSummary } from './types'

export const getRecipes = () => api<RecipeSummary[]>('/api/recipes')

export const getRecipe = (recipeId: number) => api<RecipeDetail>(`/api/recipes/${recipeId}`)
