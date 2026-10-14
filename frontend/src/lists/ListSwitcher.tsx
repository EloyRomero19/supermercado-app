import { Check, ChevronDown, Link2, Plus, ShoppingBasket } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { getMyLists } from '@/api/lists'
import type { ListSummary } from '@/api/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { listColor } from '@/items/categoryStyle'
import { cn } from '@/lib/utils'
import { JoinListDialog } from './JoinListDialog'
import { NewListDialog } from './NewListDialog'

type Props = { current: { id: string; name: string } }

/**
 * Título de la lista que, al tocarlo, despliega "Mis listas" para cambiar a otra, crear una nueva
 * o unirse con un enlace. Así la pantalla principal muestra una sola lista sin perder las demás.
 */
export function ListSwitcher({ current }: Props) {
  const navigate = useNavigate()
  const [lists, setLists] = useState<ListSummary[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [dialog, setDialog] = useState<'new' | 'join' | null>(null)

  const load = () =>
    getMyLists()
      .then((result) => {
        setLists(result)
        setFailed(false)
      })
      .catch(() => setFailed(true))

  // Al entrar, para que el menú se abra ya con contenido; y al abrirlo, para que los
  // contadores ("3 por comprar") estén al día
  useEffect(() => {
    load()
  }, [])

  return (
    <>
      {/* modal={false}: si no, al pasar del menú a un modal Radix puede dejar la página sin clics */}
      <DropdownMenu modal={false} onOpenChange={(open) => open && load()}>
        <DropdownMenuTrigger className="-ml-1 flex max-w-full min-w-0 flex-col items-start rounded-lg px-1 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <span className="text-xs font-semibold text-muted-foreground">Mis listas</span>
          <span className="flex w-full min-w-0 items-center gap-1.5">
            <span className="truncate text-xl font-bold tracking-tight">{current.name}</span>
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground" aria-hidden="true">
              <ChevronDown className="size-4" strokeWidth={2.5} />
            </span>
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" sideOffset={8} className="w-[min(21rem,calc(100vw-2rem))] rounded-2xl p-2">
          <DropdownMenuLabel className="px-2.5 pt-1.5 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Mis listas</DropdownMenuLabel>
          {lists === null && !failed && (
            <div className="flex flex-col gap-1.5 p-1" aria-label="Cargando tus listas">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          )}
          {failed && lists === null && <p className="px-2 py-3 text-sm text-destructive">No se pudieron cargar tus listas.</p>}
          {lists && (
            <div className="flex flex-col gap-1">
              {lists.map((list, index) => (
                <DropdownMenuItem
                  key={list.id}
                  onSelect={() => list.id !== current.id && navigate(`/listas/${list.id}`)}
                  className={cn('min-h-15 gap-3.5 rounded-xl px-2.5 py-2', list.id === current.id && 'bg-secondary/60')}
                  style={{ '--tone': listColor(index) } as CSSProperties}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tone-soft text-(--tone)" aria-hidden="true">
                    <ShoppingBasket className="size-5 text-(--tone)" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-semibold">{list.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{listStatus(list)}</span>
                  </span>
                  {list.id === current.id && <Check className="size-5 shrink-0 text-primary" strokeWidth={2.5} aria-label="Lista actual" />}
                </DropdownMenuItem>
              ))}
            </div>
          )}
          <DropdownMenuSeparator className="mx-1 my-2" />
          <DropdownMenuItem onSelect={() => setDialog('new')} className="min-h-12 gap-3.5 rounded-xl px-2.5 font-medium">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary" aria-hidden="true">
              <Plus className="size-5 text-primary" />
            </span>
            Nueva lista
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog('join')} className="min-h-12 gap-3.5 rounded-xl px-2.5 font-medium">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary" aria-hidden="true">
              <Link2 className="size-5 text-primary" />
            </span>
            Unirse con un enlace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NewListDialog open={dialog === 'new'} onOpenChange={(open) => setDialog(open ? 'new' : null)} />
      <JoinListDialog open={dialog === 'join'} onOpenChange={(open) => setDialog(open ? 'join' : null)} />
    </>
  )
}

function listStatus(list: ListSummary): string {
  const pending = list.itemCount - list.checkedCount
  const status = list.itemCount === 0 ? 'Vacía' : pending === 0 ? '¡Completada!' : `${pending} por comprar`
  const people = list.memberCount === 1 ? 'solo tú' : `${list.memberCount} personas`
  return `${status} · ${people}`
}
