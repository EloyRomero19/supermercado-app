import { useAuth } from '../auth/useAuth'

/** Al abrir la app sin red no sabemos si hay sesión: mejor decirlo que mandar al login. */
export function OfflineScreen() {
  const { retry } = useAuth()
  return (
    <main className="center-screen">
      <div className="card empty">
        <h2>Sin conexión</h2>
        <p className="muted">No se puede conectar con el servidor. Comprueba tu conexión a internet.</p>
        <button type="button" className="button" onClick={retry}>
          Reintentar
        </button>
      </div>
    </main>
  )
}
