import { api, jsonBody } from './client'
import type { Item, RecentItem } from './types'

const itemsUrl = (listId: string) => `/api/lists/${listId}/items`

export type NewItem = { productId: number } | { customName: string }
export type ItemChanges = Partial<{ checked: boolean; quantity: number; note: string }>

export const getItems = (listId: string) => api<Item[]>(itemsUrl(listId))

export const getRecentItems = (listId: string) => api<RecentItem[]>(`/api/lists/${listId}/recent`)

export const addItem = (listId: string, item: NewItem) => api<Item>(itemsUrl(listId), jsonBody('POST', item))

export const updateItem = (listId: string, itemId: string, changes: ItemChanges) =>
  api<Item>(`${itemsUrl(listId)}/${itemId}`, jsonBody('PATCH', changes))

export const deleteItem = (listId: string, itemId: string) =>
  api<void>(`${itemsUrl(listId)}/${itemId}`, { method: 'DELETE' })

export const clearCheckedItems = (listId: string) =>
  api<void>(`${itemsUrl(listId)}?checked=true`, { method: 'DELETE' })
