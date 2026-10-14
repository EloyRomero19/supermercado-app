import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  title: ReactNode
  /** Botón a la izquierda del título (p. ej. volver) */
  leading?: ReactNode
  /** Acciones a la derecha */
  actions?: ReactNode
  /** Contenido extra bajo el título (progreso, miembros…) */
  children?: ReactNode
  className?: string
}

/**
 * Cabecera fija arriba, limpia y con fondo translúcido. pt-safe deja sitio al notch del iPhone
 * cuando la app está instalada a pantalla completa.
 */
export function PageHeader({ title, leading, actions, children, className }: Props) {
  return (
    <header className={cn('sticky top-0 z-30 border-b bg-background/85 px-4 pb-3 pt-safe backdrop-blur-lg', className)}>
      <div className="flex min-h-11 items-center gap-2">
        {leading}
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold tracking-tight">{title}</h1>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
