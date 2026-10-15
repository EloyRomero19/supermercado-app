import { api, ApiError, jsonBody, refreshSession, setAccessToken } from './client'
import type { AuthResponse, User } from './types'

export type RegisterData = { email: string; password: string; displayName: string }

export async function register(data: RegisterData): Promise<User> {
  return startSession(await api<AuthResponse>('/api/auth/register', jsonBody('POST', data)))
}

export async function login(email: string, password: string): Promise<User> {
  return startSession(await api<AuthResponse>('/api/auth/login', jsonBody('POST', { email, password })))
}

/** Pide el email con el enlace. El backend responde igual exista o no la cuenta. */
export async function forgotPassword(email: string): Promise<void> {
  await api<void>('/api/auth/forgot-password', jsonBody('POST', { email }))
}

/** Contraseña nueva con el código del enlace; deja la sesión iniciada. */
export async function resetPassword(token: string, password: string): Promise<User> {
  return startSession(await api<AuthResponse>('/api/auth/reset-password', jsonBody('POST', { token, password })))
}

/**
 * Al cargar la app: si la cookie de refresh sigue siendo válida, recupera la sesión.
 * Devuelve 'offline' si no hay red: no sabemos si hay sesión, así que no hay que mandar al login.
 */
export async function restoreSession(): Promise<User | null | 'offline'> {
  try {
    return (await refreshSession()).user
  } catch (error) {
    // Sin red (0) o servidor caído (5xx): no es que no haya sesión, es que no podemos saberlo
    return error instanceof ApiError && (error.status === 0 || error.status >= 500) ? 'offline' : null
  }
}

export async function logout(): Promise<void> {
  try {
    await api<void>('/api/auth/logout', { method: 'POST' })
  } finally {
    // Aunque falle la petición, en este navegador la sesión se cierra igualmente
    setAccessToken(null)
  }
}

function startSession(response: AuthResponse): User {
  setAccessToken(response.accessToken)
  return response.user
}
