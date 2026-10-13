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
  categoryId: number
  categoryName: string
}

export type Category = {
  id: number
  name: string
  sortOrder: number
}
