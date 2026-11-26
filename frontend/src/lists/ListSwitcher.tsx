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
 * Botón "Mis listas" (arriba a la izquierda): despliega tus listas para cambiar a otra, crear una
 * nueva o unirse con un enlace. Así la pantalla principal muestra una sola lista sin perder las demás.
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
        <DropdownMenuTrigger className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-border pr-3 pl-4 font-semibold outline-none transition-colors duration-150 hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/60 data-[state=open]:bg-foreground/5">
          Mis listas
          <ChevronDown className="chalk size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
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
  const status = list.itemCount === 0 ? 'No falta nada' : `Falta${list.itemCount === 1 ? '' : 'n'} ${list.itemCount}`
  const people = list.memberCount === 1 ? 'solo tú' : `${list.memberCount} personas`
  return `${status}, ${people}`
}
