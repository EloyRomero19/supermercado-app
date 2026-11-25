import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  /** Icono de línea (Lucide) que acompaña al título, opcional */
  icon?: ReactNode
  title: string
  description?: ReactNode
  /** Botón o enlace con la acción que lo resuelve ("Crear lista"…) */
  action?: ReactNode
  className?: string
}

/** Estado vacío o de error: qué pasa y qué se puede hacer, en pocas palabras y alineado a la izquierda. */
export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div className={cn('flex items-start gap-4 rounded-lg bg-muted p-5', className)}>
      {icon && (
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-background text-primary [&_svg]:size-5" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
        <h2 className="chalk-title text-2xl">{title}</h2>
        {description && <p className="max-w-prose text-muted-foreground">{description}</p>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  )
}
