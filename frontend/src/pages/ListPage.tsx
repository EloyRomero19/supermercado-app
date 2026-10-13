import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { deleteList, getList, regenerateInviteCode, removeMember, renameList } from '../api/lists'
import type { ListDetail, Member } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { LoadingScreen } from '../components/LoadingScreen'
import { ProductSearch } from '../components/ProductSearch'
import { formatInviteCode, shareInvite } from '../lists/invite'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; list: ListDetail }
  | { status: 'error'; message: string }

export function ListPage() {
  const { listId = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    getList(listId)
      .then((list) => !ignore && setState({ status: 'ready', list }))
      .catch((error: unknown) => {
        if (ignore) return
        const message =
          error instanceof ApiError && error.status === 404
            ? 'Esta lista no existe o ya no tienes acceso a ella.'
            : 'No se pudo cargar la lista.'
        setState({ status: 'error', message })
      })
    return () => {
      ignore = true
    }
  }, [listId])

  if (state.status === 'loading') return <LoadingScreen />
  if (state.status === 'error') {
    return (
      <main className="center-screen">
        <div className="card empty">
          <p>{state.message}</p>
          <Link to="/">Volver a mis listas</Link>
        </div>
      </main>
    )
  }

  const { list } = state
  const isOwner = list.myRole === 'OWNER'
  const others = list.members.filter((member) => member.userId !== user?.id)
  const setList = (updated: ListDetail) => setState({ status: 'ready', list: updated })

  /** Ejecuta una acción mostrando su error, si lo hay, encima de la página. */
  async function run(action: () => Promise<void>) {
    setActionError(null)
    setNotice(null)
    try {
      await action()
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : 'Ha ocurrido un error')
    }
  }

  const rename = () =>
    run(async () => {
      const name = window.prompt('Nuevo nombre de la lista', list.name)?.trim()
      if (name && name !== list.name) setList(await renameList(list.id, name))
    })

  const share = () =>
    run(async () => {
      const result = await shareInvite(list.inviteCode, list.name)
      if (result === 'copied') setNotice('Enlace de invitación copiado. Pégalo donde quieras compartirlo.')
    })

  const newCode = () =>
    run(async () => {
      if (!window.confirm('Se generará un código nuevo y el actual dejará de funcionar. ¿Continuar?')) return
      const { inviteCode } = await regenerateInviteCode(list.id)
      setList({ ...list, inviteCode })
    })

  const expel = (member: Member) =>
    run(async () => {
      if (!window.confirm(`¿Expulsar a ${member.displayName} de la lista?`)) return
      await removeMember(list.id, member.userId)
      setList({ ...list, members: list.members.filter((m) => m.userId !== member.userId) })
    })

  const leave = () =>
    run(async () => {
      const warning = !isOwner
        ? '¿Salir de esta lista?'
        : others.length > 0
          ? `¿Salir de la lista? Pasará a ser de ${others[0].displayName}.`
          : 'Eres el único miembro: si sales, la lista se borrará. ¿Continuar?'
      if (!window.confirm(warning) || !user) return
      await removeMember(list.id, user.id)
      navigate('/', { replace: true })
    })

  const remove = () =>
    run(async () => {
      if (!window.confirm(`¿Borrar «${list.name}» para todos sus miembros? No se puede deshacer.`)) return
      await deleteList(list.id)
      navigate('/', { replace: true })
    })

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="link-button" aria-label="Volver a mis listas">
          ←
        </Link>
        <h1 className="topbar-title">{list.name}</h1>
        {isOwner ? (
          <button type="button" className="link-button" onClick={rename}>
            Renombrar
          </button>
        ) : (
          <span />
        )}
      </header>

      <main className="content">
        {actionError && <p className="alert" role="alert">{actionError}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}

        <section className="card">
          <h2>Invitar</h2>
          <p className="muted">Comparte el enlace o el código con quien quieras que use esta lista.</p>
          <p className="invite-code" aria-label="Código de invitación">
            {formatInviteCode(list.inviteCode)}
          </p>
          <div className="actions">
            <button type="button" className="button" onClick={share}>
              Compartir enlace
            </button>
            {isOwner && (
              <button type="button" className="button button-secondary" onClick={newCode}>
                Nuevo código
              </button>
            )}
          </div>
        </section>

        <section className="card">
          <h2>Miembros ({list.members.length})</h2>
          <ul className="members">
            {list.members.map((member) => (
              <li key={member.userId} className="member">
                <Avatar member={member} />
                <span className="member-name">
                  {member.displayName}
                  {member.userId === user?.id && <span className="muted"> (tú)</span>}
                </span>
                {member.role === 'OWNER' && <span className="category-tag">Propietario</span>}
                {isOwner && member.userId !== user?.id && (
                  <button type="button" className="link-button danger" onClick={() => expel(member)}>
                    Expulsar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Catálogo</h2>
          <ProductSearch />
        </section>

        <div className="actions">
          <button type="button" className="button button-secondary" onClick={leave}>
            Salir de la lista
          </button>
          {isOwner && (
            <button type="button" className="button button-danger" onClick={remove}>
              Borrar lista
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

function Avatar({ member }: { member: Member }) {
  if (member.avatarUrl) {
    // no-referrer: las fotos de Google a veces se niegan a cargar si se envía la página de origen
    return <img className="avatar" src={member.avatarUrl} alt="" referrerPolicy="no-referrer" />
  }
  return (
    <span className="avatar" aria-hidden="true">
      {member.displayName.charAt(0).toUpperCase()}
    </span>
  )
}
