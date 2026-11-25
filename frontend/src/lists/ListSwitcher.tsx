import { Check, ChevronDown, Link2, Plus, ShoppingBasket } from 'lucide-react'
import { useEffect, useState } from 'react'
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
        <DropdownMenuTrigger className="chalk-title flex h-12 max-w-full min-w-0 items-center gap-1.5 rounded-full px-2 text-left text-3xl outline-none transition-colors duration-150 hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/60">
          <span className="sr-only">Mis listas: </span>
          <span className="truncate">{current.name}</span>
          <ChevronDown className="chalk size-5 shrink-0 text-title" strokeWidth={2.5} aria-hidden="true" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" sideOffset={6} className="w-[min(22rem,calc(100vw-2rem))] p-1.5">
          <DropdownMenuLabel className="chalk-title px-3 pt-1.5 pb-1.5 text-xl">Mis listas</DropdownMenuLabel>
          {lists === null && !failed && (
            <div className="flex flex-col gap-1.5 p-1" aria-label="Cargando tus listas">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          )}
          {failed && lists === null && <p className="px-2 py-3 text-sm text-destructive">No se pudieron cargar tus listas.</p>}
          {lists && (
            <div className="flex flex-col">
              {lists.map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  onSelect={() => list.id !== current.id && navigate(`/listas/${list.id}`)}
                  className={cn('min-h-14 gap-3 px-3 py-2', list.id === current.id && 'bg-secondary')}
                >
                  <ShoppingBasket className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-semibold">{list.name}</span>
                    <span className="truncate text-sm text-muted-foreground">{listStatus(list)}</span>
                  </span>
                  {list.id === current.id && <Check className="size-5 shrink-0 text-primary" strokeWidth={2.5} aria-label="Lista actual" />}
                </DropdownMenuItem>
              ))}
            </div>
          )}
          <DropdownMenuSeparator className="my-1.5" />
          <DropdownMenuItem onSelect={() => setDialog('new')} className="min-h-12 gap-3 px-3 font-semibold">
            <Plus className="size-5 shrink-0 text-primary" aria-hidden="true" />
            Nueva lista
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog('join')} className="min-h-12 gap-3 px-3 font-semibold">
            <Link2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
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
  const status = list.itemCount === 0 ? 'Vacía' : pending === 0 ? 'Todo cogido' : `${pending} por comprar`
  const people = list.memberCount === 1 ? 'solo tú' : `${list.memberCount} personas`
  return `${status}, ${people}`
}
