import { ChevronRight, Link2, Plus, ShoppingBasket, Users } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '@/api/client'
import { createList, getMyLists, joinList } from '@/api/lists'
import type { ListSummary } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { CardSkeleton } from '@/components/AppSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { FormAlert } from '@/components/FormAlert'
import { PageHeader } from '@/components/PageHeader'
import { SubmitButton } from '@/components/SubmitButton'
import { useSubmit } from '@/components/useSubmit'
import { UserAvatar } from '@/components/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { listColor } from '@/items/categoryStyle'
import { extractInviteCode } from '@/lists/invite'
import { onlyErrors } from '@/lib/validation'
import { InstallCard } from '@/pwa/InstallCard'

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [lists, setLists] = useState<ListSummary[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const newListInput = useRef<HTMLInputElement>(null)

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

  const create = useSubmit(
    async () => {
      const list = await createList(newName)
      navigate(`/listas/${list.id}`)
    },
    () => onlyErrors({ name: newName.trim() ? undefined : 'Ponle un nombre a la lista' }),
  )

  const join = useSubmit(
    async () => {
      const list = await joinList(extractInviteCode(inviteLink) ?? '')
      navigate(`/listas/${list.id}`)
    },
    () => onlyErrors({ code: extractInviteCode(inviteLink) ? undefined : 'Eso no parece un enlace de invitación. Pega el enlace completo.' }),
  )

  const firstName = user?.displayName.split(' ')[0] ?? ''

  return (
    <>
      <PageHeader
        title={`Hola, ${firstName} 👋`}
        actions={
          user && (
            <Link to="/cuenta" aria-label="Tu cuenta" className="rounded-full">
              <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} />
            </Link>
          )
        }
      >
        <p className="text-sm text-muted-foreground">¿Qué toca comprar hoy?</p>
      </PageHeader>

      <main className="flex flex-col gap-6 p-4">
        <section aria-labelledby="mis-listas" className="flex flex-col gap-3">
          <h2 id="mis-listas" className="px-1 text-sm font-semibold text-muted-foreground">
            Tus listas
          </h2>
          <FormAlert message={loadError} />
          {lists === null && !loadError && (
            <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando tus listas">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )}
          {lists?.length === 0 && (
            <EmptyState
              icon="🧺"
              title="Aún no tienes listas"
              description="Crea tu primera lista o únete a la de otra persona con su QR o su enlace."
              action={
                <Button size="lg" onClick={() => newListInput.current?.focus()}>
                  <Plus aria-hidden="true" />
                  Crear una lista
                </Button>
              }
            />
          )}
          {lists && lists.length > 0 && (
            <ul className="flex flex-col gap-3">
              {lists.map((list, index) => (
                <li key={list.id} className="motion-safe:animate-tile-in">
                  <ListCard list={list} color={listColor(index)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <Card className="gap-3 px-4 py-4">
          <h2 className="font-semibold">Nueva lista</h2>
          <form className="flex flex-col gap-2" onSubmit={create.onSubmit} noValidate>
            <FormAlert message={create.error && !create.fieldErrors.name ? create.error : null} />
            <div className="flex gap-2">
              <Input
                ref={newListInput}
                className="h-11 flex-1 text-base"
                aria-label="Nombre de la lista"
                aria-invalid={create.fieldErrors.name ? true : undefined}
                placeholder="Casa, Piso de la playa…"
                maxLength={100}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <SubmitButton submitting={create.submitting} submittingLabel="Creando…">
                <Plus aria-hidden="true" />
                Crear
              </SubmitButton>
            </div>
            {create.fieldErrors.name && <p className="text-sm font-medium text-destructive">{create.fieldErrors.name}</p>}
          </form>
        </Card>

        {/* Plegado por defecto: es algo puntual y así no ocupa sitio */}
        <Card className="gap-0 px-4 py-0">
          <details className="group" open={lists?.length === 0 || undefined}>
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 font-semibold [&::-webkit-details-marker]:hidden">
              <Link2 className="size-5 text-primary" aria-hidden="true" />
              Unirse con un enlace
              <ChevronRight className="ml-auto size-5 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden="true" />
            </summary>
            <form className="flex flex-col gap-2 pb-4" onSubmit={join.onSubmit} noValidate>
              <p className="text-sm text-muted-foreground">
                ¿Te han enviado una invitación? Pega aquí el enlace (o escanea su QR con la cámara).
              </p>
              <FormAlert message={join.error && !join.fieldErrors.code ? join.error : null} />
              <div className="flex gap-2">
                <Input
                  className="h-11 flex-1 text-base"
                  inputMode="url"
                  aria-label="Enlace de invitación"
                  aria-invalid={join.fieldErrors.code ? true : undefined}
                  placeholder="https://…/unirse/K7MX4QPA"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={inviteLink}
                  onChange={(e) => setInviteLink(e.target.value)}
                />
                <SubmitButton submitting={join.submitting} submittingLabel="Uniendo…">
                  Unirse
                </SubmitButton>
              </div>
              {join.fieldErrors.code && <p className="text-sm font-medium text-destructive">{join.fieldErrors.code}</p>}
            </form>
          </details>
        </Card>

        <InstallCard />
      </main>
    </>
  )
}

/** Tarjeta de cada lista: color propio, lo que falta por comprar y el progreso. */
function ListCard({ list, color }: { list: ListSummary; color: string }) {
  const pending = list.itemCount - list.checkedCount
  const status = list.itemCount === 0 ? 'Vacía' : pending === 0 ? '¡Completada! 🎉' : `${pending} por comprar`
  const people = list.memberCount === 1 ? 'Solo tú' : `${list.memberCount} personas`

  return (
    <Link
      to={`/listas/${list.id}`}
      style={{ '--tone': color } as CSSProperties}
      className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-xs transition-all outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.99]"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-tone-soft text-(--tone)">
        <ShoppingBasket className="size-6" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-center gap-2">
          <span className="truncate text-base font-semibold">{list.name}</span>
          {list.myRole === 'OWNER' && (
            <Badge variant="secondary" className="shrink-0">
              Tuya
            </Badge>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {status}
          <span aria-hidden="true">·</span>
          <Users className="size-3.5" aria-hidden="true" />
          {people}
        </span>
        {list.itemCount > 0 && (
          <Progress
            value={(list.checkedCount / list.itemCount) * 100}
            className="h-1.5"
            aria-label={`${list.checkedCount} de ${list.itemCount} en el carrito`}
          />
        )}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}
