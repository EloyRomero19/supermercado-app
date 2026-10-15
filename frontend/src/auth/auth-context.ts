import { createContext } from 'react'
import type { RegisterData } from '../api/auth'
import type { User } from '../api/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'offline'

export type AuthContextValue = {
  status: AuthStatus
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  /** Borra la cuenta y cierra la sesión. Falla (sin cerrarla) si la contraseña no es correcta. */
  deleteAccount: (password: string) => Promise<void>
  /** Vuelve a intentar recuperar la sesión (tras 'offline'). */
  retry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
