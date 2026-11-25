import { LogOut, QrCode, SearchX, Share2, ShoppingBasket, Trash2, UserPlus } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { addItem, clearCheckedItems, deleteItem, getItems, getRecentItems, updateItem, type NewItem } from '@/api/items'
import { deleteList, getList, regenerateInviteCode, removeMember, renameList } from '@/api/lists'
import type { Item, ListDetail, Member, RecentItem } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { AppSkeleton } from '@/components/AppSkeleton'
import { BottomSheet } from '@/components/BottomSheet'
import { BrandMark } from '@/components/BrandMark'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { ProductSearch } from '@/components/ProductSearch'
import { useConfirm } from '@/components/useConfirm'
import { UserAvatar } from '@/components/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { addWithUndo, errorMessage } from '@/items/itemFeedback'
import { CartButton, CartPanel, CartSheet } from '@/items/Cart'
import { ItemList } from '@/items/ItemList'
import { RecentItems } from '@/items/RecentItems'
import { sortItems } from '@/items/sortItems'
import { inviteUrl, shareInvite } from '@/lists/invite'
import { rememberLastList } from '@/lists/lastList'
import { applyListEvent } from '@/lists/listEvents'
import { ListSwitcher } from '@/lists/ListSwitcher'
import { useListEvents, type ConnectionStatus } from '@/lists/useListEvents'
import { cn } from '@/lib/utils'
import { CategoryBrowser } from '@/products/CategoryBrowser'
import type { CatalogActions } from '@/products/ProductRow'

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
  const [cartOpen, setCartOpen] = useState(false)
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
      loadList(listId).then(setState)
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
  const inCart = items.filter((item) => item.checked).length

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

  // Igual que si llegara por tiempo real: actualiza la lista y "recientes" a la vez
  const applySaved = (item: Item) =>
    setState((prev) => {
      if (prev.status !== 'ready' || !user) return prev
      const outcome = applyListEvent(prev, 'item-saved', item, user.id)
      return 'view' in outcome ? { status: 'ready', ...outcome.view } : prev
    })

  const add = (newItem: NewItem) => {
    ownActions.mark()
    return addWithUndo(list.id, newItem, items, { onSaved: applySaved, onRemoved: dropItem })
  }

  /**
   * Tachar o quitar la raya. Actualización optimista: se tacha en pantalla al instante, sin esperar
   * al servidor (en el súper la cobertura suele ser mala). Si la petición falla, se deshace.
   * No hace falta un aviso con "Deshacer": lo tachado sigue a la vista y otro toque lo devuelve.
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
    run(async () => {
      upsertItem(await updateItem(list.id, item.id, { note }))
      toast.success(note.trim() ? 'Nota guardada' : 'Nota borrada')
    })

  const removeItem = (item: Item) =>
    run(async () => {
      await deleteItem(list.id, item.id)
      dropItem(item.id)
      // Deshacer = volver a añadirlo tal cual (con su cantidad y su nota)
      const again: NewItem = {
        ...(item.productId !== null ? { productId: item.productId } : { customName: item.name }),
        quantity: item.quantity,
        ...(item.note ? { note: item.note } : {}),
      }
      toast(`«${item.name}» quitado de la lista`, {
        action: { label: 'Deshacer', onClick: () => run(async () => applySaved(await addItem(list.id, again))) },
      })
    })

  const clearCart = () =>
    run(async () => {
      const ok = await confirm({
        title: '¿Terminar la compra?',
        description: `Se borrará de la pizarra lo tachado (${inCart}). Lo que falte se queda para la próxima vez.`,
        confirmLabel: 'Terminar la compra',
      })
      if (!ok) return
      await clearCheckedItems(list.id)
      setItems((current) => current.filter((i) => !i.checked))
      toast.success('Compra terminada')
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

  // Productos del catálogo que ya están pendientes en la lista, para el selector − 1 + del buscador
  // y de las secciones. "−" quita una unidad o, si solo queda una, el producto (con su "Deshacer").
  const pendingByProduct = new Map(items.filter((i) => !i.checked && i.productId !== null).map((i) => [i.productId as number, i]))
  const catalog: CatalogActions = {
    quantityOf: (productId) => pendingByProduct.get(productId)?.quantity ?? 0,
    add: (product) => add({ productId: product.id }),
    removeOne: (product) => {
      const item = pendingByProduct.get(product.id)
      if (!item) return
      if (item.quantity > 1) changeQuantity(item, item.quantity - 1)
      else removeItem(item)
    },
  }

  return (
    <>
      {/* Cabecera: logo, lista actual, compartir, carrito con contador y el buscador */}
      <PageHeader
        className="pb-3"
        innerClassName="max-w-3xl xl:max-w-none"
        leading={<BrandMark className="size-9 lg:hidden" />}
        title={<ListSwitcher current={list} />}
        actions={
          <>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label={`Compartir la lista (${list.members.length} ${list.members.length === 1 ? 'miembro' : 'miembros'})`}
              className="flex h-12 items-center gap-1.5 rounded-full px-3 text-sm font-bold outline-none transition-colors duration-150 hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/60"
            >
              <UserPlus className="chalk size-6" strokeWidth={1.75} aria-hidden="true" />
              <span className="tabular-nums" aria-hidden="true">
                {list.members.length}
              </span>
            </button>
            <CartButton className="xl:hidden" count={inCart} onClick={() => setCartOpen(true)} />
          </>
        }
      >
        <ProductSearch className="mt-1 xl:max-w-3xl" catalog={catalog} onAddCustom={(customName) => add({ customName })} />
      </PageHeader>

      {/* Primero la pizarra con lo que falta (para eso se abre la app); debajo, para añadir más: las
          secciones y lo comprado otras veces. En pantallas anchas, lo tachado siempre a la vista. */}
      <div className="flex-1 xl:grid xl:grid-cols-[minmax(0,1fr)_23rem]">
        <main className={cn('flex w-full max-w-3xl flex-col gap-10 px-4 pt-5 lg:px-8 xl:mx-0', inCart > 0 && 'pb-24 xl:pb-0')}>
          <section aria-labelledby="list-title" className="flex flex-col gap-5">
            <h2 id="list-title" className="sr-only">
              Lo que falta
            </h2>
            <ListStatus total={items.length} inCart={inCart} connection={connection} remoteUpdate={remoteUpdate > 0} />
            <ItemList items={items} onToggle={toggle} onQuantity={changeQuantity} onNote={editNote} onDelete={removeItem} />
          </section>

          <CategoryBrowser catalog={catalog} />
          <RecentItems recent={recent} items={items} onAdd={add} />
        </main>

        {/* Escritorio ancho: lo tachado siempre a la vista */}
        <aside aria-labelledby="cart-title" className="hidden border-l bg-card xl:block">
          <div className="sticky top-[8.5rem] flex max-h-[calc(100dvh-8.5rem)] flex-col overflow-y-auto px-5 pt-5">
            <h2 id="cart-title" className="chalk-title mb-2 flex items-center gap-2.5 text-2xl">
              <ShoppingBasket className="chalk size-7 text-foreground" strokeWidth={1.75} aria-hidden="true" />
              En la cesta
              {inCart > 0 && (
                <span key={inCart} className="grid h-6 min-w-6 animate-bump place-items-center rounded-full bg-primary px-1.5 font-sans text-sm font-bold text-primary-foreground tabular-nums">
                  {inCart}
                </span>
              )}
            </h2>
            <CartPanel items={items} onReturn={(item) => toggle(item)} onFinish={clearCart} />
          </div>
        </aside>
      </div>

      {/* Móvil y tablet: "Terminar la compra" siempre a mano en cuanto hay algo tachado */}
      {inCart > 0 && (
        <div className="bottom-above-tabbar fixed inset-x-0 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur-sm lg:left-(--rail-width) xl:hidden">
          <Button size="lg" className="mx-auto flex w-full max-w-3xl" onClick={clearCart}>
            Terminar la compra ({inCart})
          </Button>
        </div>
      )}

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} items={items} onReturn={(item) => toggle(item)} onFinish={clearCart} />

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

type ListStatusProps = { total: number; inCart: number; connection: ConnectionStatus; remoteUpdate: boolean }

/**
 * El titular de la pizarra: cuántos productos faltan, a tiza amarilla y en grande. Al lado, si la
 * lista está sincronizada en tiempo real; debajo, cuántos hay tachados.
 */
function ListStatus({ total, inCart, connection, remoteUpdate }: ListStatusProps) {
  const pending = total - inCart
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end justify-between gap-3">
        <p className="chalk-title text-4xl tabular-nums">
          {total === 0 ? 'Nada apuntado' : pending === 0 ? 'No falta nada' : `Falta${pending === 1 ? '' : 'n'} ${pending}`}
        </p>
        <LiveStatus status={connection} remoteUpdate={remoteUpdate} />
      </div>
      {total > 0 && (
        <p className="text-sm text-muted-foreground tabular-nums">
          {inCart === 0 ? 'Nada tachado todavía' : `${inCart} ${inCart === 1 ? 'tachado' : 'tachados'} de ${total}`}
        </p>
      )}
    </div>
  )
}

/** Indicador discreto de sincronización; dice "Actualizado" un momento si otra persona cambia algo. */
function LiveStatus({ status, remoteUpdate }: { status: ConnectionStatus; remoteUpdate: boolean }) {
  const live = status === 'live'
  return (
    <span role="status" className="flex items-center gap-1.5 pb-1 text-xs whitespace-nowrap text-muted-foreground">
      <span className={cn('size-2 rounded-full', live ? 'bg-success' : status === 'reconnecting' ? 'bg-warning' : 'bg-muted-foreground/40', remoteUpdate && live && 'animate-ping')} aria-hidden="true" />
      {remoteUpdate && live ? <span className="font-semibold text-title">Cambiado por otra persona</span> : LIVE_STATUS_TEXT[status]}
    </span>
  )
}
