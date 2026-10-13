import { api, jsonBody, refreshSession, setAccessToken } from './client'
import type { AuthResponse, User } from './types'

export type RegisterData = { email: string; password: string; displayName: string }

export async function register(data: RegisterData): Promise<User> {
  return startSession(await api<AuthResponse>('/api/auth/register', jsonBody('POST', data)))
}

export async function login(email: string, password: string): Promise<User> {
  return startSession(await api<AuthResponse>('/api/auth/login', jsonBody('POST', { email, password })))
}

/** Al cargar la app: si la cookie de refresh sigue siendo válida, recupera la sesión. */
export async function restoreSession(): Promise<User | null> {
  try {
    return (await refreshSession()).user
  } catch {
    return null
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
