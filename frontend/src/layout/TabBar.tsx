import { ChefHat, ListChecks, UserRound } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { BrandMark } from '@/components/BrandMark'
import { cn } from '@/lib/utils'

/**
 * Navegación principal. En el móvil, barra inferior fija (a mano del pulgar); desde 1024 px,
 * menú lateral con el logo. La pestaña activa lleva una píldora detrás del icono: se ve dónde
 * estás aunque no distingas bien los colores.
 */
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
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t-2 bg-background pb-safe',
        'lg:inset-x-auto lg:top-0 lg:left-0 lg:w-(--rail-width) lg:border-t-0 lg:border-r-2 lg:px-4 lg:pt-5 lg:pb-4',
      )}
    >
      <Link to="/" className="chalk-title mb-8 hidden items-center gap-3 rounded-lg px-2 py-1 text-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 lg:flex">
        <BrandMark className="size-9" />
        ¿Qué falta?
      </Link>
      <div className="mx-auto flex h-(--tabbar-height) max-w-xl lg:h-auto lg:flex-col lg:gap-1">
        {tabs.map(({ to, label, Icon, active }) => (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground outline-none transition-colors duration-150',
              'hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset',
              'lg:h-12 lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-full lg:px-4 lg:text-base',
              active && 'text-primary hover:text-primary lg:bg-secondary lg:text-secondary-foreground',
            )}
          >
            <span
              className={cn(
                'grid h-8 w-14 place-items-center rounded-full transition-colors duration-200 lg:h-auto lg:w-auto',
                active && 'bg-secondary lg:bg-transparent',
              )}
              aria-hidden="true"
            >
              <Icon className="chalk size-[1.375rem] lg:size-5" strokeWidth={active ? 2.25 : 1.75} />
            </span>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
