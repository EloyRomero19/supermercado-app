import { ChefHat, ListChecks, UserRound } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/utils'

/** Barra de navegación inferior, como en las apps del móvil: siempre a mano del pulgar. */
export function TabBar() {
  const { pathname } = useLocation()

  const tabs = [
    { to: '/', label: 'Listas', Icon: ListChecks, active: pathname === '/' || pathname.startsWith('/listas/') },
    { to: '/recetas', label: 'Recetas', Icon: ChefHat, active: pathname.startsWith('/recetas') },
    { to: '/cuenta', label: 'Cuenta', Icon: UserRound, active: pathname === '/cuenta' },
  ]

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-safe backdrop-blur-lg"
    >
      <div className="mx-auto flex h-(--tabbar-height) max-w-xl">
        {tabs.map(({ to, label, Icon, active }) => (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors',
              'outline-none focus-visible:text-foreground active:scale-95 motion-safe:transition-transform',
              active && 'text-primary',
            )}
          >
            {/* "Píldora" de color detrás del icono de la pestaña activa */}
            <span className={cn('grid h-7 w-14 place-items-center rounded-full transition-colors', active && 'bg-secondary')}>
              <Icon className="size-5" strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
            </span>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
