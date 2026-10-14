import { api, jsonBody } from './client'
import type { Item, RecentItem } from './types'

const itemsUrl = (listId: string) => `/api/lists/${listId}/items`

/** Del catálogo (productId) o texto libre (customName); cantidad y nota opcionales (el backend ya las acepta). */
export type NewItem = ({ productId: number } | { customName: string }) & { quantity?: number; note?: string }
export type ItemChanges = Partial<{ checked: boolean; quantity: number; note: string }>

export const getItems = (listId: string) => api<Item[]>(itemsUrl(listId))

export const getRecentItems = (listId: string) => api<RecentItem[]>(`/api/lists/${listId}/recent`)

export const addItem = (listId: string, item: NewItem) => api<Item>(itemsUrl(listId), jsonBody('POST', item))

/** Varios productos de una vez, en una sola transacción (p. ej. los ingredientes de una receta). */
export const addItems = (listId: string, items: NewItem[]) =>
  api<Item[]>(`${itemsUrl(listId)}/bulk`, jsonBody('POST', { items }))

export const updateItem = (listId: string, itemId: string, changes: ItemChanges) =>
  api<Item>(`${itemsUrl(listId)}/${itemId}`, jsonBody('PATCH', changes))

export const deleteItem = (listId: string, itemId: string) =>
  api<void>(`${itemsUrl(listId)}/${itemId}`, { method: 'DELETE' })

export const clearCheckedItems = (listId: string) =>
  api<void>(`${itemsUrl(listId)}?checked=true`, { method: 'DELETE' })
