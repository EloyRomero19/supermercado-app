import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { InstallCard } from '../pwa/InstallCard'

export function SettingsPage() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <div className="page">
      <header className="hero">
        <h1>Ajustes</h1>
      </header>
      <main className="content">
        <section className="card profile-card">
          {user.avatarUrl ? (
            // no-referrer: las fotos de Google a veces se niegan a cargar si se envía la página de origen
            <img className="avatar avatar-lg" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="avatar avatar-lg" aria-hidden="true">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="profile-text">
            <h2>{user.displayName}</h2>
            <p className="muted">{user.email}</p>
          </div>
        </section>

        <InstallCard />

        <section className="card settings-links">
          <Link to="/privacidad" className="settings-link">
            <span aria-hidden="true">🔒</span>
            Privacidad
            <span className="chevron" aria-hidden="true">
              ›
            </span>
          </Link>
        </section>

        <button type="button" className="button button-danger button-block" onClick={logout}>
          Cerrar sesión
        </button>
      </main>
    </div>
  )
}
