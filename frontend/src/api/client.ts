import type { AuthResponse, ProblemDetail } from './types'

/** Error de la API con el mensaje del backend y, si los hay, los errores por campo. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// El access token vive SOLO en esta variable (memoria). No va a localStorage: un script
// inyectado (XSS) podría leerlo de ahí. Al recargar la página se pierde y se recupera con
// /api/auth/refresh, que usa la cookie HttpOnly que JavaScript no puede leer.
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

type Listener = () => void
const sessionExpiredListeners = new Set<Listener>()

/** Avisa cuando la sesión ya no se puede renovar (p. ej. refresh token caducado o revocado). */
export function onSessionExpired(listener: Listener): () => void {
  sessionExpiredListeners.add(listener)
  return () => sessionExpiredListeners.delete(listener)
}

let refreshInFlight: Promise<AuthResponse> | null = null

/**
 * Pide un access token nuevo usando la cookie de refresh.
 * Si ya hay un refresh en marcha, devuelve esa misma promesa: el backend revoca toda la
 * sesión si recibe dos veces el mismo refresh token (lo interpreta como un robo).
 */
export function refreshSession(): Promise<AuthResponse> {
  refreshInFlight ??= withCrossTabLock(() => request<AuthResponse>('/api/auth/refresh', { method: 'POST' }))
    .then((response) => {
      accessToken = response.accessToken
      return response
    })
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

/**
 * Lo anterior evita duplicados dentro de una pestaña, pero cada pestaña tiene su propia memoria.
 * Web Locks pone en fila los refresh de todas las pestañas: cuando le toca a la segunda,
 * la cookie ya es la nueva (las cookies sí se comparten), así que no reutiliza la antigua.
 */
function withCrossTabLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('auth-refresh', task)
  }
  return task()
}

/**
 * fetch con el access token y renovación automática: si el backend responde 401
 * (token caducado), renueva la sesión una vez y repite la petición. Devuelve la Response
 * tal cual; la usan api() y el stream de eventos en tiempo real.
 */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await send(path, init)

  // En /api/auth/* un 401 significa "credenciales incorrectas", no "token caducado"
  if (response.status !== 401 || path.startsWith('/api/auth/')) return response

  try {
    await refreshSession()
  } catch {
    accessToken = null
    sessionExpiredListeners.forEach((listener) => listener())
    throw new ApiError(401, 'Tu sesión ha caducado. Vuelve a iniciar sesión')
  }
  return send(path, init)
}

/** authFetch + convertir la respuesta en JSON (o en ApiError si es un error). */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  return parse<T>(await authFetch(path, init))
}

/** Atajo para peticiones con cuerpo JSON */
export function jsonBody(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) }
}

function request<T>(path: string, init: RequestInit): Promise<T> {
  return send(path, init).then((response) => parse<T>(response))
}

async function send(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  try {
    // same-origin: el navegador envía la cookie de refresh (gracias al proxy de Vite somos el mismo origen)
    return await fetch(path, { ...init, headers, credentials: 'same-origin' })
  } catch (error) {
    // Cancelada a propósito con AbortController: no es un fallo de red, se propaga tal cual
    if (init.signal?.aborted) throw error
    throw new ApiError(0, 'No se pudo conectar con el servidor')
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
  }
  const problem = (await response.json().catch(() => null)) as ProblemDetail | null
  throw new ApiError(response.status, problem?.detail ?? `Error ${response.status}`, problem?.errors)
}
