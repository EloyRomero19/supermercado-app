// Tipos de la API del backend (deben coincidir con los records Java)

export type User = {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
}

/** Respuesta de /api/auth/register, /login y /refresh. El refresh token viaja en una cookie HttpOnly. */
export type AuthResponse = {
  accessToken: string
  expiresIn: number
  user: User
}

/** Formato de error del backend (RFC 9457) */
export type ProblemDetail = {
  status: number
  title?: string
  detail?: string
  errors?: Record<string, string>
}

export type Product = {
  id: number
  name: string
  icon: string
  categoryId: number
  categoryName: string
}

export type Category = {
  id: number
  name: string
  sortOrder: number
}

export type ListRole = 'OWNER' | 'MEMBER'

export type ListSummary = {
  id: string
  name: string
  myRole: ListRole
  memberCount: number
  itemCount: number
  checkedCount: number
}

export type Member = {
  userId: string
  displayName: string
  avatarUrl: string | null
  role: ListRole
}

export type ListDetail = {
  id: string
  name: string
  inviteCode: string
  myRole: ListRole
  members: Member[]
}

export type Item = {
  id: string
  productId: number | null
  name: string
  /** Emoji del producto; en los escritos a mano lo deduce el backend del texto (null si no lo reconoce) */
  icon: string | null
  categoryId: number | null
  categoryName: string | null
  categoryOrder: number | null
  quantity: number
  note: string | null
  checked: boolean
  checkedByName: string | null
  checkedAt: string | null
  addedByName: string | null
  createdAt: string
}
