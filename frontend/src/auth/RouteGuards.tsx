import { Navigate, Outlet, useLocation, type Location } from 'react-router'
import { AppSkeleton } from '../components/AppSkeleton'
import { OfflineScreen } from '../components/OfflineScreen'
import { useAuth } from './useAuth'

/** Rutas que requieren sesión: si no la hay, manda a /login recordando a dónde iba. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <AppSkeleton />
  if (status === 'offline') return <OfflineScreen />
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

/** Rutas solo para invitados (login, registro): con sesión iniciada vuelve a donde iba. */
export function GuestOnly() {
  const { status } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/'

  if (status === 'loading') return <AppSkeleton />
  if (status === 'offline') return <OfflineScreen />
  if (status === 'authenticated') return <Navigate to={from} replace />
  return <Outlet />
}
