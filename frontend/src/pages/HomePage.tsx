import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { createList, getMyLists, joinList } from '../api/lists'
import type { ListSummary } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { Progress } from '../components/Progress'
import { useSubmit } from '../components/useSubmit'
import { listColor } from '../items/categoryStyle'
import { extractInviteCode } from '../lists/invite'

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [lists, setLists] = useState<ListSummary[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [inviteLink, setInviteLink] = useState('')

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

  const join = useSubmit(async () => {
    const code = extractInviteCode(inviteLink)
    if (!code) throw new ApiError(400, 'Eso no parece un enlace de invitación. Pega el enlace completo que te enviaron.')
    const list = await joinList(code)
    navigate(`/listas/${list.id}`)
  })

  const firstName = user?.displayName.split(' ')[0] ?? ''

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <span className="hero-brand">
            <img src="/favicon.svg" alt="" width="28" height="28" />
            Compra
          </span>
          <Link to="/ajustes" className="hero-avatar" aria-label="Ajustes">
            {user?.avatarUrl ? (
              <img className="avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="avatar">{firstName.charAt(0).toUpperCase()}</span>
            )}
          </Link>
        </div>
        <h1>Hola, {firstName} 👋</h1>
        <p className="hero-subtitle">¿Qué toca comprar hoy?</p>
      </header>

      <main className="content">
        {loadError && <p className="alert" role="alert">{loadError}</p>}
        {lists === null && !loadError && <div className="card skeleton" aria-busy="true" aria-label="Cargando tus listas" />}

        {lists?.length === 0 && (
          <section className="card empty-state">
            <span className="empty-emoji" aria-hidden="true">
              🧺
            </span>
            <h2>Aún no tienes listas</h2>
            <p className="muted">Crea una abajo o únete a la de otra persona escaneando su QR o con su enlace.</p>
          </section>
        )}

        {lists && lists.length > 0 && (
          <section>
            <h2 className="section-title">Tus listas</h2>
            <ul className="list-cards">
              {lists.map((list, index) => (
                <li key={list.id}>
                  <ListCard list={list} color={listColor(index)} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <form className="card" onSubmit={create.onSubmit}>
          <h2>✨ Nueva lista</h2>
          {create.error && <p className="alert" role="alert">{create.fieldErrors.name ?? create.error}</p>}
          <div className="inline-form">
            <input
              className="input"
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

        {/* Plegado por defecto: es algo puntual y así no ocupa sitio */}
        <details className="card disclosure" open={lists?.length === 0 || undefined}>
          <summary>
            <h2>🔗 Unirse con un enlace</h2>
          </summary>
          <form className="form" onSubmit={join.onSubmit}>
            <p className="muted">¿Te han enviado una invitación? Pega aquí el enlace (o escanea su QR con la cámara).</p>
            {join.error && <p className="alert" role="alert">{join.fieldErrors.code ?? join.error}</p>}
            <div className="inline-form">
              <input
                className="input"
                type="text"
                inputMode="url"
                aria-label="Enlace de invitación"
                placeholder="https://…/unirse/K7MX4QPA"
                required
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
              />
              <button type="submit" className="button" disabled={join.submitting}>
                Unirse
              </button>
            </div>
          </form>
        </details>

      </main>
    </div>
  )
}

/** Tarjeta grande y a color de cada lista, con lo que falta por comprar y el progreso. */
function ListCard({ list, color }: { list: ListSummary; color: string }) {
  const pending = list.itemCount - list.checkedCount
  const people = list.memberCount === 1 ? 'Solo tú' : `${list.memberCount} personas`

  return (
    <Link to={`/listas/${list.id}`} className="list-card" style={{ '--tone': color } as CSSProperties}>
      <span className="list-card-emoji" aria-hidden="true">
        🛒
      </span>
      <span className="list-card-top">
        <span className="list-card-pending">
          {list.itemCount === 0 ? (
            'Vacía'
          ) : pending === 0 ? (
            '¡Completada! 🎉'
          ) : (
            <>
              <strong>{pending}</strong> por comprar
            </>
          )}
        </span>
        {list.myRole === 'OWNER' && <span className="list-card-badge">Tuya</span>}
      </span>
      <span className="list-card-name">{list.name}</span>
      <span className="list-card-meta">👥 {people}</span>
      {list.itemCount > 0 && <Progress done={list.checkedCount} total={list.itemCount} />}
    </Link>
  )
}
