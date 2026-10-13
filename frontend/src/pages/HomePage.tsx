import { useAuth } from '../auth/useAuth'
import { ProductSearch } from '../components/ProductSearch'

export function HomePage() {
  const { user, logout } = useAuth()

  return (
    <div className="app">
      <header className="topbar">
        <h1>Mis listas</h1>
        <button type="button" className="link-button" onClick={logout}>
          Cerrar sesión
        </button>
      </header>
      <main className="content">
        <p>
          Hola, <strong>{user?.displayName}</strong>
        </p>
        <section className="card empty">
          <p className="muted">Todavía no tienes listas de la compra.</p>
        </section>
        <section className="card">
          <h2>Catálogo</h2>
          <ProductSearch />
        </section>
      </main>
    </div>
  )
}
