import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  title: ReactNode
  /** Botón o logo a la izquierda del título (p. ej. volver) */
  leading?: ReactNode
  /** Acciones a la derecha */
  actions?: ReactNode
  /** Contenido extra bajo el título (el buscador…) */
  children?: ReactNode
  className?: string
  /** Ancho del contenido: el mismo que el de la página, para que todo quede alineado */
  innerClassName?: string
}

/**
 * Cabecera fija arriba, del color del fondo y con un filete inferior. pt-safe deja sitio al notch
 * del iPhone cuando la app está instalada a pantalla completa.
 */
export function PageHeader({ title, leading, actions, children, className, innerClassName = 'max-w-3xl' }: Props) {
  return (
    <header className={cn('sticky top-0 z-30 border-b bg-background px-4 pt-safe pb-2 lg:px-8', className)}>
      <div className={cn('mx-auto w-full', innerClassName)}>
        <div className="flex min-h-12 items-center gap-2">
          {leading}
          <h1 className="chalk-title min-w-0 flex-1 truncate text-2xl">{title}</h1>
          {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
        {children}
      </div>
    </header>
  )
}
