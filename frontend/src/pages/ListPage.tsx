import { LogOut, QrCode, SearchX, Share2, Trash2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { addItem, deleteItem, getItems, getRecentItems, updateItem, type NewItem } from '@/api/items'
import { deleteList, getList, regenerateInviteCode, removeMember, renameList } from '@/api/lists'
import type { Item, ListDetail, Member, RecentItem } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { AppSkeleton } from '@/components/AppSkeleton'
import { BottomSheet } from '@/components/BottomSheet'
import { EmptyState } from '@/components/EmptyState'
import { ProductSearch } from '@/components/ProductSearch'
import { useConfirm } from '@/components/useConfirm'
import { UserAvatar } from '@/components/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { errorMessage } from '@/items/itemFeedback'
import { ItemList } from '@/items/ItemList'
import { RecentItems } from '@/items/RecentItems'
import { sortItems } from '@/items/sortItems'
import { inviteUrl, shareInvite } from '@/lists/invite'
import { rememberLastList } from '@/lists/lastList'
import { applyListEvent } from '@/lists/listEvents'
import { ListSwitcher } from '@/lists/ListSwitcher'
import { useListEvents, type ConnectionStatus } from '@/lists/useListEvents'
import { cn } from '@/lib/utils'
import { withViewTransition } from '@/lib/viewTransition'
import { SectionLinks } from '@/products/SectionLinks'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; list: ListDetail; items: Item[]; recent: RecentItem[] }
  | { status: 'error'; message: string }

/** Carga la lista y sus productos a la vez. Se usa al entrar y al reconectar el tiempo real. */
async function loadList(listId: string): Promise<LoadState> {
  try {
    // Las tres peticiones a la vez, no una detrás de otra
    const [list, items, recent] = await Promise.all([getList(listId), getItems(listId), getRecentItems(listId)])
    return { status: 'ready', list, items, recent }
  } catch (error) {
    const message =
      error instanceof ApiError && error.status === 404
        ? 'Esta lista no existe o ya no tienes acceso a ella.'
        : 'No se pudo cargar la lista.'
    return { status: 'error', message }
  }
}

/** Un evento que llega más tarde de esto tras una acción nuestra se considera de otra persona. */
const OWN_ACTION_WINDOW_MS = 1500

/**
 * Recuerda cuándo hicimos la última acción, para distinguir los eventos en tiempo real que
 * provocamos nosotros de los de otros miembros (estos encienden "Actualizado ahora").
 */
function createOwnActionClock() {
  let last = 0
  return {
    mark: () => {
      last = Date.now()
    },
    isRecent: () => Date.now() - last < OWN_ACTION_WINDOW_MS,
  }
}

/**
 * key={listId}: al cambiar de lista desde "Mis listas ▾" la página se monta de cero (carga,
 * tiempo real y paneles de la lista nueva), sin arrastrar nada de la anterior.
 */
export function ListRoute() {
  const { listId = '' } = useParams()
  return <ListPage key={listId} listId={listId} />
}

function ListPage({ listId }: { listId: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { confirm, confirmDialog } = useConfirm()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [shareOpen, setShareOpen] = useState(false)
  const [remoteUpdate, setRemoteUpdate] = useState(0)

  // Mientras salimos o borramos la lista nosotros mismos, ignoramos los eventos: si no, se vería
  // un instante "ya no eres miembro" antes de volver a "Mis listas"
  const leavingRef = useRef(false)
  const [ownActions] = useState(createOwnActionClock)

  useEffect(() => {
    let ignore = false
    loadList(listId).then((loaded) => {
      if (ignore) return
      setState(loaded)
      // Para que las recetas añadan por defecto a esta lista
      if (loaded.status === 'ready') rememberLastList(listId)
    })
    return () => {
      ignore = true
    }
  }, [listId])

  // "Actualizado ahora" dura un par de segundos tras un cambio de otra persona
  useEffect(() => {
    if (!remoteUpdate) return
    const timer = setTimeout(() => setRemoteUpdate(0), 2500)
    return () => clearTimeout(timer)
  }, [remoteUpdate])

  // Tiempo real: cada cambio de otro miembro llega como evento y se aplica sobre el estado actual
  const connection = useListEvents(listId, state.status === 'ready', {
    onEvent: (type, data) => {
      if (!ownActions.isRecent()) setRemoteUpdate((n) => n + 1)
      setState((prev) => {
        if (prev.status !== 'ready' || !user || leavingRef.current) return prev
        const outcome = applyListEvent(prev, type, data, user.id)
        return 'gone' in outcome ? { status: 'error', message: outcome.gone } : { status: 'ready', ...outcome.view }
      })
    },
    onReconnected: () => {
      // Si la recarga falla (p. ej. la red vuelve a caerse justo ahora) se conserva lo que ya se
      // ve: la conexión acaba de abrirse, así que la lista sigue existiendo y seguimos siendo miembros.
      loadList(listId).then((loaded) => {
        if (loaded.status === 'ready' && !leavingRef.current) setState(loaded)
      })
    },
    onGone: () => setState({ status: 'error', message: 'Esta lista no existe o ya no tienes acceso a ella.' }),
  })

  if (state.status === 'loading') return <AppSkeleton label="Cargando la lista" />
  if (state.status === 'error') {
    return (
      <main className="mx-auto w-full max-w-3xl p-4">
        <EmptyState
          icon={<SearchX />}
          title="Lista no disponible"
          description={state.message}
          action={
            <Button asChild>
              <Link to="/">Ir a mis listas</Link>
            </Button>
          }
        />
      </main>
    )
  }

  const { list, items, recent } = state
  const isOwner = list.myRole === 'OWNER'
  const others = list.members.filter((member) => member.userId !== user?.id)

  // Actualizaciones con función (prev => ...): parten del estado más reciente aunque varias
  // respuestas lleguen seguidas, en vez de una copia que podría estar ya desfasada.
  const setList = (update: (list: ListDetail) => ListDetail) =>
    setState((prev) => (prev.status === 'ready' ? { ...prev, list: update(prev.list) } : prev))
  const setItems = (update: (items: Item[]) => Item[]) =>
    setState((prev) => (prev.status === 'ready' ? { ...prev, items: sortItems(update(prev.items)) } : prev))
  const upsertItem = (item: Item) => setItems((current) => [...current.filter((i) => i.id !== item.id), item])
  const dropItem = (itemId: string) => setItems((current) => current.filter((i) => i.id !== itemId))

  /** Ejecuta una acción y, si falla, lo avisa con un toast. */
  async function run(action: () => Promise<void>) {
    ownActions.mark()
    try {
      await action()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  // Igual que si llegara por tiempo real: actualiza la lista y "Otras veces" a la vez.
  // Con transición: la ficha viaja desde "Otras veces" (o aparece) en la rejilla de lo que falta.
  const applySaved = (item: Item) =>
    withViewTransition(() =>
      setState((prev) => {
        if (prev.status !== 'ready' || !user) return prev
        const outcome = applyListEvent(prev, 'item-saved', item, user.id)
        return 'view' in outcome ? { status: 'ready', ...outcome.view } : prev
      }),
    )

  const add = (newItem: NewItem) =>
    run(async () => {
      const saved = await addItem(list.id, newItem)
      // Si ya estaba pendiente, el backend suma la cantidad: se avisa, porque la ficha no se mueve
      const before = items.find((item) => item.id === saved.id)
      applySaved(saved)
      if (before) toast.success(`${saved.name}: ahora ${saved.quantity}`)
    })

  /**
   * Un toque en una ficha de lo que falta: ya lo tienes, fuera de la lista. Optimista: desaparece
   * al instante, sin esperar al servidor (en el súper la cobertura suele ser mala); si falla,
   * vuelve. Con "Deshacer" por si fue sin querer (se añade otra vez con su cantidad y su nota).
   */
  const take = (item: Item) =>
    run(async () => {
      withViewTransition(() => dropItem(item.id))
      try {
        await deleteItem(list.id, item.id)
      } catch (error) {
        // 404: otra persona lo quitó justo antes; el resultado es el mismo
        if (error instanceof ApiError && error.status === 404) return
        upsertItem(item)
        throw error
      }
      const again: NewItem = {
        ...(item.productId !== null ? { productId: item.productId } : { customName: item.name }),
        quantity: item.quantity,
        ...(item.note ? { note: item.note } : {}),
      }
      toast(`«${item.name}» quitado de la lista`, {
        action: { label: 'Deshacer', onClick: () => run(async () => applySaved(await addItem(list.id, again))) },
      })
    })

  const changeQuantity = (item: Item, quantity: number) =>
    run(async () => upsertItem(await updateItem(list.id, item.id, { quantity })))

  const editNote = (item: Item, note: string) =>
    run(async () => {
      upsertItem(await updateItem(list.id, item.id, { note }))
      toast.success(note.trim() ? 'Nota guardada' : 'Nota borrada')
    })

  const rename = (name: string) =>
    run(async () => {
      const updated = await renameList(list.id, name)
      setList(() => updated)
      toast.success('Nombre cambiado')
    })

  const share = () =>
    run(async () => {
      const result = await shareInvite(list.inviteCode, list.name)
      if (result === 'copied') toast.success('Enlace de invitación copiado', { description: 'Pégalo donde quieras compartirlo.' })
    })

  const newCode = () =>
    run(async () => {
      const ok = await confirm({
        title: '¿Generar un QR nuevo?',
        description: 'El QR y el enlace actuales dejarán de funcionar. Útil si se han compartido con quien no debía.',
        confirmLabel: 'Generar',
      })
      if (!ok) return
      const { inviteCode } = await regenerateInviteCode(list.id)
      setList((current) => ({ ...current, inviteCode }))
      toast.success('Nuevo QR generado')
    })

  const expel = (member: Member) =>
    run(async () => {
      const ok = await confirm({ title: `¿Expulsar a ${member.displayName}?`, description: 'Dejará de ver esta lista.', confirmLabel: 'Expulsar', destructive: true })
      if (!ok) return
      await removeMember(list.id, member.userId)
      setList((current) => ({ ...current, members: current.members.filter((m) => m.userId !== member.userId) }))
      toast.success(`${member.displayName} ya no está en la lista`)
    })

  const leave = () =>
    run(async () => {
      const description = !isOwner
        ? 'Dejarás de ver esta lista. Podrás volver con una nueva invitación.'
        : others.length > 0
          ? `La lista pasará a ser de ${others[0].displayName}.`
          : 'Eres el único miembro: si sales, la lista se borrará.'
      if (!(await confirm({ title: '¿Salir de la lista?', description, confirmLabel: 'Salir', destructive: true })) || !user) return
      leavingRef.current = true
      try {
        await removeMember(list.id, user.id)
      } catch (error) {
        leavingRef.current = false
        throw error
      }
      toast.success(`Has salido de «${list.name}»`)
      navigate('/', { replace: true })
    })

  const remove = () =>
    run(async () => {
      const ok = await confirm({
        title: `¿Borrar «${list.name}»?`,
        description: 'Se borrará para todos sus miembros. No se puede deshacer.',
        confirmLabel: 'Borrar lista',
        destructive: true,
      })
      if (!ok) return
      leavingRef.current = true
      try {
        await deleteList(list.id)
      } catch (error) {
        leavingRef.current = false
        throw error
      }
      toast.success('Lista borrada')
      navigate('/', { replace: true })
    })

  // Productos del catálogo pendientes en la lista: en el buscador salen en teja (ya están)
  const pendingByProduct = new Map(items.filter((i) => i.productId !== null).map((i) => [i.productId as number, i]))

  return (
    <>
      <header className="mx-auto w-full max-w-4xl px-4 pt-safe lg:px-8">
        <div>
          <div className="flex h-16 items-center justify-between gap-3">
            <ListSwitcher current={list} />
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="flex h-11 items-center gap-2 rounded-full border-2 border-border pr-4 pl-3.5 font-semibold outline-none transition-colors duration-150 hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/60"
            >
              <QrCode className="chalk size-5" strokeWidth={1.75} aria-hidden="true" />
              Compartir
            </button>
          </div>

          <div className="mt-4 flex items-end justify-between gap-4">
            <h1 className="chalk-title min-w-0 text-4xl break-words">{list.name}</h1>
            <MemberStack members={list.members} onClick={() => setShareOpen(true)} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-semibold tabular-nums">{items.length === 0 ? 'No falta nada' : `Falta${items.length === 1 ? '' : 'n'} ${items.length}`}</p>
            <LiveStatus status={connection} remoteUpdate={remoteUpdate > 0} />
          </div>
        </div>
      </header>

      {/* Primero lo que falta (para eso se abre la app); después, para añadir más: lo de otras
          veces y, al final del todo, las secciones. pb-28: hueco para el buscador fijo de abajo. */}
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-9 px-4 pt-4 pb-28 lg:px-8">
        <section aria-label="Lo que falta">
          <ItemList items={items} onTake={take} onQuantity={changeQuantity} onNote={editNote} />
        </section>
        <RecentItems recent={recent} items={items} onAdd={add} />
        <SectionLinks listId={list.id} />
      </main>

      <ProductSearch
        pendingOf={(productId) => pendingByProduct.get(productId)}
        // Como el backend (findFirstCustom): mismo texto sin distinguir mayúsculas
        pendingCustom={(name) => items.find((i) => i.productId === null && i.name.trim().toLowerCase() === name.trim().toLowerCase())}
        onAdd={(product) => add({ productId: product.id })}
        onTake={take}
        onAddCustom={(customName) => add({ customName })}
      />

      <BottomSheet open={shareOpen} onClose={() => setShareOpen(false)} title="Compartir lista" description="Invita a quien quieras que use esta lista contigo.">
        <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
          {/* El QR contiene el enlace de invitación. Fondo blanco siempre (también en modo oscuro):
              muchos lectores no reconocen un QR con los colores invertidos. */}
          <div className="rounded-md border bg-white p-2">
            <QRCodeSVG value={inviteUrl(list.inviteCode)} size={176} marginSize={1} bgColor="#ffffff" fgColor="#000000" title={`Código QR para unirse a «${list.name}»`} />
          </div>
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            Escanéalo con la cámara del móvil. A quien no esté contigo, envíale el enlace.
          </p>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
            <Button className="h-11" onClick={share}>
              <Share2 aria-hidden="true" />
              Compartir enlace
            </Button>
            {isOwner && (
              <Button variant="outline" className="h-11" onClick={newCode}>
                <QrCode aria-hidden="true" />
                Generar QR nuevo
              </Button>
            )}
          </div>
        </div>

        <section aria-labelledby="members-title" className="flex flex-col gap-1">
          <h3 id="members-title" className="text-sm font-semibold">
            Miembros ({list.members.length})
          </h3>
          <ul className="flex flex-col divide-y">
            {list.members.map((member) => (
              <li key={member.userId} className="flex min-h-13 items-center gap-3">
                <UserAvatar name={member.displayName} />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {member.displayName}
                  {member.userId === user?.id && <span className="font-normal text-muted-foreground"> (tú)</span>}
                </span>
                {member.role === 'OWNER' && <Badge variant="secondary">Propietario</Badge>}
                {isOwner && member.userId !== user?.id && (
                  <Button variant="ghost" size="sm" className="h-11 text-destructive hover:text-destructive" onClick={() => expel(member)}>
                    Expulsar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <Separator />

        {isOwner && <RenameForm key={list.name} name={list.name} onRename={rename} />}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" className="h-11" onClick={leave}>
            <LogOut aria-hidden="true" />
            Salir de la lista
          </Button>
          {isOwner && (
            <Button variant="outline" className="h-11 text-destructive hover:text-destructive" onClick={remove}>
              <Trash2 aria-hidden="true" />
              Borrar lista
            </Button>
          )}
        </div>
      </BottomSheet>

      {confirmDialog}
    </>
  )
}

/** Hasta tres iniciales de los miembros, solapadas, y "+N" si hay más. Abre "Compartir". */
function MemberStack({ members, onClick }: { members: Member[]; onClick: () => void }) {
  const shown = members.slice(0, 3)
  const extra = members.length - shown.length
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Miembros de la lista: ${members.length}. Ver y compartir`}
      className="flex shrink-0 items-center rounded-full p-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60"
    >
      {shown.map((member, index) => (
        <UserAvatar key={member.userId} name={member.displayName} className={cn('size-10 ring-[3px] ring-background', index > 0 && '-ml-2.5')} />
      ))}
      {extra > 0 && (
        <span className="-ml-2.5 grid size-10 place-items-center rounded-full bg-muted text-sm font-bold ring-[3px] ring-background tabular-nums">+{extra}</span>
      )}
    </button>
  )
}

function RenameForm({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  const [value, setValue] = useState(name)
  const trimmed = value.trim()
  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault()
        if (trimmed && trimmed !== name) onRename(trimmed)
      }}
    >
      <label htmlFor="list-name" className="text-sm font-semibold text-muted-foreground">
        Nombre de la lista
      </label>
      <div className="flex gap-2">
        <Input id="list-name" className="h-11 flex-1 text-base" maxLength={100} value={value} onChange={(e) => setValue(e.target.value)} />
        <Button type="submit" className="h-11" disabled={!trimmed || trimmed === name}>
          Guardar
        </Button>
      </div>
    </form>
  )
}

const LIVE_STATUS_TEXT: Record<ConnectionStatus, string> = {
  connecting: 'Conectando…',
  live: 'En directo',
  reconnecting: 'Reconectando…',
}

/** Indicador discreto de sincronización; dice "Cambiado por otra persona" un momento si alguien cambia algo. */
function LiveStatus({ status, remoteUpdate }: { status: ConnectionStatus; remoteUpdate: boolean }) {
  const live = status === 'live'
  return (
    <span role="status" className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
      <span className={cn('size-2 rounded-full', live ? 'bg-success' : status === 'reconnecting' ? 'bg-warning' : 'bg-muted-foreground/40')} aria-hidden="true" />
      {remoteUpdate && live ? <span className="font-semibold text-title">Cambiado por otra persona</span> : LIVE_STATUS_TEXT[status]}
    </span>
  )
}
