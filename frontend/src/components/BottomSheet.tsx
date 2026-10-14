import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

/**
 * Panel que sube desde abajo (el Sheet de shadcn/ui, hecho con Radix). Radix se encarga del foco,
 * la tecla Escape, el fondo oscuro y de bloquear el scroll de la página de detrás.
 */
export function BottomSheet({ open, onClose, title, description, children, className }: Props) {
  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent
        side="bottom"
        className={cn('mx-auto max-h-[90dvh] w-full max-w-xl gap-0 overflow-y-auto rounded-t-2xl pb-safe', className)}
      >
        {/* Asa visual: indica que es un panel deslizable */}
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted" aria-hidden="true" />
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">{title}</SheetTitle>
          {/* Radix pide descripción para lectores de pantalla; si no hay, se oculta visualmente */}
          <SheetDescription className={description ? undefined : 'sr-only'}>{description ?? title}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
