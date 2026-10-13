import { api, jsonBody } from './client'
import type { ListDetail, ListSummary } from './types'

const base = '/api/lists'

export const getMyLists = () => api<ListSummary[]>(base)

export const createList = (name: string) => api<ListDetail>(base, jsonBody('POST', { name }))

export const getList = (listId: string) => api<ListDetail>(`${base}/${listId}`)

export const renameList = (listId: string, name: string) =>
  api<ListDetail>(`${base}/${listId}`, jsonBody('PATCH', { name }))

export const deleteList = (listId: string) => api<void>(`${base}/${listId}`, { method: 'DELETE' })

export const regenerateInviteCode = (listId: string) =>
  api<{ inviteCode: string }>(`${base}/${listId}/invite-code`, { method: 'POST' })

export const joinList = (code: string) => api<ListDetail>(`${base}/join`, jsonBody('POST', { code }))

/** Expulsar a otro miembro, o salir de la lista si memberId es tu propio id. */
export const removeMember = (listId: string, memberId: string) =>
  api<void>(`${base}/${listId}/members/${memberId}`, { method: 'DELETE' })
