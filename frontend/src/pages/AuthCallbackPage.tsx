import { Navigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { LoadingScreen } from '../components/LoadingScreen'

/**
 * Aquí vuelve el backend tras el login con Google, con la cookie de refresh ya puesta.
 * No hay que hacer nada especial: al cargar la app, AuthProvider usa esa cookie para
 * recuperar la sesión. Solo esperamos a saber el resultado y redirigimos.
 */
export function AuthCallbackPage() {
  const { status } = useAuth()

  if (status === 'loading' || status === 'offline') return <LoadingScreen />
  return <Navigate to={status === 'authenticated' ? '/' : '/login?error=google'} replace />
}
