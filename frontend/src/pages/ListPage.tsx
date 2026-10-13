import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { addItem, clearCheckedItems, deleteItem, getItems, updateItem, type NewItem } from '../api/items'
import { deleteList, getList, regenerateInviteCode, removeMember, renameList } from '../api/lists'
import type { Item, ListDetail, Member } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { LoadingScreen } from '../components/LoadingScreen'
import { Progress } from '../components/Progress'
import { ProductSearch } from '../components/ProductSearch'
import { Sheet } from '../components/Sheet'
import { ItemList } from '../items/ItemList'
import { sortItems } from '../items/sortItems'
import { inviteUrl, shareInvite } from '../lists/invite'
import { rememberLastList } from '../lists/lastList'
import { CategoryBrowser } from '../products/CategoryBrowser'
import { applyListEvent } from '../lists/listEvents'
import { useListEvents, type ConnectionStatus } from '../lists/useListEvents'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; list: ListDetail; items: Item[] }
  | { status: 'error'; message: string }

/** Carga la lista y sus productos a la vez. Se usa al entrar y al reconectar el tiempo real. */
async function loadList(listId: string): Promise<LoadState> {
  try {
    const [list, items] = await Promise.all([getList(listId), getItems(listId)])
    return { status: 'ready', list, items }
  } catch (error) {
    const message =
      error instanceof ApiError && error.status === 404
        ? 'Esta lista no existe o ya no tienes acceso a ella.'
        : 'No se pudo cargar la lista.'
    return { status: 'error', message }
  }
}

export function ListPage() {
  const { listId = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  // Mientras salimos o borramos la lista nosotros mismos, ignoramos los eventos: si no, se vería
  // un instante "ya no eres miembro" antes de volver a "Mis listas"
  const leavingRef = useRef(false)

  useEffect(() => {
    let ignore = false
    loadList(listId).then((loaded) => {
      if (ignore) return
      setState(loaded)
      // Para la pestaña "Comprar" de la barra inferior
      if (loaded.status === 'ready') rememberLastList(listId)
    })
    return () => {
      ignore = true
    }
  }, [listId])

  // Tiempo real: cada cambio de otro miembro llega como evento y se aplica sobre el estado actual
  const connection = useListEvents(listId, state.status === 'ready', {
    onEvent: (type, data) =>
      setState((prev) => {
        if (prev.status !== 'ready' || !user || leavingRef.current) return prev
        const outcome = applyListEvent(prev, type, data, user.id)
        return 'gone' in outcome ? { status: 'error', message: outcome.gone } : { status: 'ready', ...outcome.view }
      }),
    onReconnected: () => {
      loadList(listId).then(setState)
    },
    onGone: () => setState({ status: 'error', message: 'Esta lista no existe o ya no tienes acceso a ella.' }),
  })

  if (state.status === 'loading') return <LoadingScreen />
  if (state.status === 'error') {
    return (
      <main className="center-screen">
        <div className="card empty-state">
          <p>{state.message}</p>
          <Link to="/">Volver a mis listas</Link>
        </div>
      </main>
    )
  }

  const { list, items } = state
  const isOwner = list.myRole === 'OWNER'
  const others = list.members.filter((member) => member.userId !== user?.id)

  // Actualizaciones con función (prev => ...): parten del estado más reciente aunque varias
  // respuestas lleguen seguidas, en vez de una copia que podría estar ya desfasada.
  const setList = (updated: ListDetail) =>
    setState((prev) => (prev.status === 'ready' ? { ...prev, list: updated } : prev))
  const setItems = (update: (items: Item[]) => Item[]) =>
    setState((prev) => (prev.status === 'ready' ? { ...prev, items: sortItems(update(prev.items)) } : prev))
  const upsertItem = (item: Item) => setItems((current) => [...current.filter((i) => i.id !== item.id), item])

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

  const add = (newItem: NewItem) => run(async () => upsertItem(await addItem(list.id, newItem)))

  /**
   * Actualización optimista: se marca en pantalla al instante, sin esperar al servidor (en el
   * súper la cobertura suele ser mala). Si la petición falla, se deshace el cambio.
   */
  const toggle = (item: Item) =>
    run(async () => {
      upsertItem({ ...item, checked: !item.checked, checkedByName: item.checked ? null : (user?.displayName ?? null) })
      try {
        upsertItem(await updateItem(list.id, item.id, { checked: !item.checked }))
      } catch (error) {
        upsertItem(item)
        throw error
      }
    })

  const changeQuantity = (item: Item, quantity: number) =>
    run(async () => upsertItem(await updateItem(list.id, item.id, { quantity })))

  const editNote = (item: Item, note: string) =>
    run(async () => upsertItem(await updateItem(list.id, item.id, { note })))

  const removeItem = (item: Item) =>
    run(async () => {
      await deleteItem(list.id, item.id)
      setItems((current) => current.filter((i) => i.id !== item.id))
    })

  const clearCart = () =>
    run(async () => {
      if (!window.confirm('¿Quitar de la lista todo lo que ya está en el carro?')) return
      await clearCheckedItems(list.id)
      setItems((current) => current.filter((i) => !i.checked))
    })

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
      if (!window.confirm('Se generará un QR nuevo y el QR y el enlace actuales dejarán de funcionar. ¿Continuar?')) return
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
      leavingRef.current = true
      try {
        await removeMember(list.id, user.id)
      } catch (error) {
        leavingRef.current = false
        throw error
      }
      navigate('/', { replace: true })
    })

  const remove = () =>
    run(async () => {
      if (!window.confirm(`¿Borrar «${list.name}» para todos sus miembros? No se puede deshacer.`)) return
      leavingRef.current = true
      try {
        await deleteList(list.id)
      } catch (error) {
        leavingRef.current = false
        throw error
      }
      navigate('/', { replace: true })
    })

  const inCart = items.filter((item) => item.checked).length
  const messages = (
    <>
      {actionError && <p className="alert" role="alert">{actionError}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}
    </>
  )

  return (
    <div className="page">
      <header className="hero hero-list">
        <div className="hero-top">
          <Link to="/" className="hero-action hero-back" aria-label="Volver a mis listas">
            ←
          </Link>
          <LiveStatus status={connection} />
          <button type="button" className="hero-action" onClick={() => setShareOpen(true)}>
            Compartir
          </button>
        </div>
        <h1>{list.name}</h1>
        <div className="hero-meta">
          <button type="button" className="avatar-stack" aria-label="Ver miembros" onClick={() => setShareOpen(true)}>
            {list.members.slice(0, 4).map((member) => (
              <Avatar key={member.userId} member={member} />
            ))}
            {list.members.length > 4 && <span className="avatar avatar-more">+{list.members.length - 4}</span>}
          </button>
          {items.length > 0 && <Progress done={inCart} total={items.length} label={`${inCart} de ${items.length} en el carro`} />}
        </div>
      </header>

      <main className="content">
        {messages}

        <section className="card search-card">
          <ProductSearch
            onSelect={(product) => add({ productId: product.id })}
            onAddCustom={(customName) => add({ customName })}
          />
        </section>

        <ItemList
          items={items}
          onToggle={toggle}
          onQuantity={changeQuantity}
          onNote={editNote}
          onDelete={removeItem}
          onClearChecked={clearCart}
        />

        <CategoryBrowser items={items} onAdd={(product) => add({ productId: product.id })} />
      </main>

      <Sheet open={shareOpen} onClose={() => setShareOpen(false)} title="Compartir lista">
        {messages}
        <div className="share-qr">
          {/* El QR contiene el enlace de invitación. Fondo blanco siempre (también en modo oscuro):
              muchos lectores no reconocen un QR con los colores invertidos. */}
          <div className="invite-qr">
            <QRCodeSVG
              value={inviteUrl(list.inviteCode)}
              size={192}
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#000000"
              title={`Código QR para unirse a «${list.name}»`}
            />
          </div>
          <p className="muted center">
            Escanéalo con la cámara del móvil para unirte. A quien no esté contigo, envíale el enlace.
          </p>
        </div>
        <div className="actions">
          <button type="button" className="button" onClick={share}>
            Compartir enlace
          </button>
          {isOwner && (
            <button type="button" className="button button-secondary" onClick={newCode}>
              Generar QR nuevo
            </button>
          )}
        </div>

        <h3 className="sheet-section">Miembros ({list.members.length})</h3>
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
                <button type="button" className="chip-button danger" onClick={() => expel(member)}>
                  Expulsar
                </button>
              )}
            </li>
          ))}
        </ul>

        <h3 className="sheet-section">Opciones</h3>
        <div className="actions">
          {isOwner && (
            <button type="button" className="button button-secondary" onClick={rename}>
              Renombrar
            </button>
          )}
          <button type="button" className="button button-secondary" onClick={leave}>
            Salir de la lista
          </button>
          {isOwner && (
            <button type="button" className="button button-danger" onClick={remove}>
              Borrar lista
            </button>
          )}
        </div>
      </Sheet>
    </div>
  )
}

const LIVE_STATUS_TEXT: Record<ConnectionStatus, string> = {
  connecting: 'Conectando…',
  live: 'En directo',
  reconnecting: 'Reconectando…',
}

/** Indica si los cambios de los demás están llegando en tiempo real. */
function LiveStatus({ status }: { status: ConnectionStatus }) {
  return (
    <span className={`live-status live-status-${status}`} role="status">
      {LIVE_STATUS_TEXT[status]}
    </span>
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
