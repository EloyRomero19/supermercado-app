import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import { onSessionExpired } from '../api/client'
import { forgetLastList } from '../lists/lastList'
import type { User } from '../api/types'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)

  const setSession = useCallback((user: User | null) => {
    setUser(user)
    setStatus(user ? 'authenticated' : 'anonymous')
  }, [])

  // Al arrancar intentamos recuperar la sesión con la cookie. En desarrollo, StrictMode
  // ejecuta este efecto dos veces; no pasa nada porque refreshSession() comparte la petición.
  // "attempt" permite reintentarlo desde la pantalla de "sin conexión".
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let ignore = false
    authApi.restoreSession().then((restored) => {
      if (ignore) return
      if (restored === 'offline') setStatus('offline')
      else setSession(restored)
    })
    return () => {
      ignore = true
    }
  }, [setSession, attempt])

  useEffect(() => onSessionExpired(() => setSession(null)), [setSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login: async (email, password) => setSession(await authApi.login(email, password)),
      register: async (data) => setSession(await authApi.register(data)),
      logout: async () => {
        try {
          await authApi.logout()
        } finally {
          // Si otra persona entra después en este navegador, que las recetas no añadan a nuestra lista
          forgetLastList()
          setSession(null)
        }
      },
      retry: () => {
        setStatus('loading')
        setAttempt((n) => n + 1)
      },
    }),
    [status, user, setSession],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
