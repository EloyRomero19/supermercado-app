import { createContext } from 'react'
import type { RegisterData } from '../api/auth'
import type { User } from '../api/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'offline'

export type AuthContextValue = {
  status: AuthStatus
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  /** Contraseña nueva con el enlace del email (entra directamente). */
  resetPassword: (token: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Vuelve a intentar recuperar la sesión (tras 'offline'). */
  retry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
