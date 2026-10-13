import { api } from './client'
import type { Category, Product } from './types'

export function searchProducts(query: string, limit: number, signal?: AbortSignal): Promise<Product[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) })
  return api<Product[]>(`/api/products?${params}`, { signal })
}

export function getCategories(): Promise<Category[]> {
  return api<Category[]>('/api/categories')
}
