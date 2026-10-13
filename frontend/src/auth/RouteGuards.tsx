import { Navigate, Outlet, useLocation, type Location } from 'react-router'
import { useAuth } from './useAuth'

/** Rutas que requieren sesión: si no la hay, manda a /login recordando a dónde iba. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingScreen />
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

/** Rutas solo para invitados (login, registro): con sesión iniciada vuelve a donde iba. */
export function GuestOnly() {
  const { status } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/'

  if (status === 'loading') return <LoadingScreen />
  if (status === 'authenticated') return <Navigate to={from} replace />
  return <Outlet />
}

function LoadingScreen() {
  return (
    <main className="center-screen" aria-busy="true">
      <p className="muted">Cargando…</p>
    </main>
  )
}
