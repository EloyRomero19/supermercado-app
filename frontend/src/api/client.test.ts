import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, onSessionExpired, setAccessToken } from './client'

const user = { id: '1', email: 'ana@test.com', displayName: 'Ana' }

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

/** Simula el backend: rutas → respuesta. Guarda cada petición para poder comprobarla. */
function mockBackend(handler: (path: string, init: RequestInit) => Response | Promise<Response>) {
  const fetchMock = vi.fn((path: string, init: RequestInit) => Promise.resolve(handler(path, init)))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function authHeader(init: RequestInit | undefined) {
  return new Headers(init?.headers).get('Authorization')
}

describe('api()', () => {
  beforeEach(() => setAccessToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it('envía el access token en la cabecera Authorization', async () => {
    setAccessToken('token-1')
    const fetchMock = mockBackend(() => json(200, user))

    await expect(api('/api/me')).resolves.toEqual(user)
    expect(authHeader(fetchMock.mock.calls[0][1])).toBe('Bearer token-1')
  })

  it('con un 401 renueva el token y repite la petición', async () => {
    setAccessToken('caducado')
    const fetchMock = mockBackend((path, init) => {
      if (path === '/api/auth/refresh') return json(200, { accessToken: 'nuevo', expiresIn: 900, user })
      return authHeader(init) === 'Bearer nuevo' ? json(200, user) : json(401, {})
    })

    await expect(api('/api/me')).resolves.toEqual(user)
    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual(['/api/me', '/api/auth/refresh', '/api/me'])
  })

  it('varias peticiones con 401 a la vez comparten un único refresh', async () => {
    setAccessToken('caducado')
    const fetchMock = mockBackend(async (path, init) => {
      if (path === '/api/auth/refresh') {
        await new Promise((resolve) => setTimeout(resolve, 10)) // el refresh tarda un poco
        return json(200, { accessToken: 'nuevo', expiresIn: 900, user })
      }
      return authHeader(init) === 'Bearer nuevo' ? json(200, user) : json(401, {})
    })

    await Promise.all([api('/api/me'), api('/api/me'), api('/api/me')])
    expect(fetchMock.mock.calls.filter(([path]) => path === '/api/auth/refresh')).toHaveLength(1)
  })

  it('si el refresh falla, avisa de que la sesión ha caducado', async () => {
    setAccessToken('caducado')
    mockBackend(() => json(401, { status: 401, detail: 'La sesión ha caducado' }))
    const listener = vi.fn()
    const unsubscribe = onSessionExpired(listener)

    await expect(api('/api/me')).rejects.toMatchObject({ status: 401 })
    expect(listener).toHaveBeenCalledOnce()
    unsubscribe()
  })

  it('un 401 en /api/auth/* es un error de credenciales, no intenta renovar', async () => {
    const fetchMock = mockBackend(() => json(401, { status: 401, detail: 'Email o contraseña incorrectos' }))

    await expect(api('/api/auth/login', { method: 'POST' })).rejects.toThrow('Email o contraseña incorrectos')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('convierte un ProblemDetail en ApiError con los errores por campo', async () => {
    mockBackend(() =>
      json(400, { status: 400, detail: 'Hay campos no válidos', errors: { email: 'El email no es válido' } }),
    )

    const error = await api('/api/auth/register', { method: 'POST' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, message: 'Hay campos no válidos', fieldErrors: { email: 'El email no es válido' } })
  })

  it('si no hay conexión lanza un ApiError legible', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))

    await expect(api('/api/me')).rejects.toThrow('No se pudo conectar con el servidor')
  })

  it('una petición cancelada no se confunde con un fallo de red', async () => {
    const controller = new AbortController()
    vi.stubGlobal('fetch', vi.fn(() => {
      controller.abort()
      return Promise.reject(new DOMException('Aborted', 'AbortError'))
    }))

    const error = await api('/api/products?q=le', { signal: controller.signal }).catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ name: 'AbortError' })
  })
})
