import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { createList, getMyLists } from '../api/lists'
import type { ListSummary } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { useSubmit } from '../components/useSubmit'

export function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [lists, setLists] = useState<ListSummary[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    // "ignore" evita guardar una respuesta si el componente ya se desmontó (o en el doble efecto de StrictMode)
    let ignore = false
    getMyLists()
      .then((result) => !ignore && setLists(result))
      .catch((error: unknown) => !ignore && setLoadError(error instanceof ApiError ? error.message : 'Error al cargar tus listas'))
    return () => {
      ignore = true
    }
  }, [])

  const create = useSubmit(async () => {
    const list = await createList(newName)
    navigate(`/listas/${list.id}`)
  })

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

        {loadError && <p className="alert" role="alert">{loadError}</p>}
        {lists === null && !loadError && <p className="muted">Cargando…</p>}
        {lists?.length === 0 && (
          <section className="card empty">
            <p className="muted">Todavía no tienes listas. Crea una, o escanea el QR de la lista de otra persona para unirte.</p>
          </section>
        )}
        {lists && lists.length > 0 && (
          <ul className="list-cards">
            {lists.map((list) => (
              <li key={list.id}>
                <Link to={`/listas/${list.id}`} className="card list-card">
                  <span className="list-card-name">{list.name}</span>
                  <span className="muted">
                    {list.memberCount === 1 ? 'Solo tú' : `${list.memberCount} personas`}
                    {list.myRole === 'OWNER' && ' · propietario'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <form className="card" onSubmit={create.onSubmit}>
          <h2>Nueva lista</h2>
          {create.error && <p className="alert" role="alert">{create.fieldErrors.name ?? create.error}</p>}
          <div className="inline-form">
            <input
              aria-label="Nombre de la lista"
              placeholder="Casa, Piso de la playa…"
              required
              maxLength={100}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="submit" className="button" disabled={create.submitting}>
              Crear
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
