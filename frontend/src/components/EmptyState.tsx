import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  /** Emoji o icono grande que ilustra el estado */
  icon: ReactNode
  title: string
  description?: ReactNode
  /** Botón o enlace con la acción que lo resuelve ("Crear una lista"…) */
  action?: ReactNode
  className?: string
}

/** Estado vacío amable: qué pasa y qué se puede hacer, en vez de una pantalla en blanco. */
export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-card px-6 py-10 text-center', className)}>
      <div className="mb-1 grid size-16 place-items-center rounded-full bg-secondary text-3xl text-secondary-foreground" aria-hidden="true">
        {icon}
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
