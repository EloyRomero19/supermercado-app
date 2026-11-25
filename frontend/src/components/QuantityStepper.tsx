import { Minus, Plus } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  /** Nombre del producto, para las etiquetas de los botones */
  name: string
  /** Cantidad pendiente en la lista (0 = aún no está) */
  quantity: number
  onAdd: () => void
  onRemove: () => void
  className?: string
}

/**
 * "Añadir" y, en cuanto el producto está en la lista, el selector − 1 + (como en una tienda online).
 * Mismo ancho en los dos estados para que la fila no salte al pulsar.
 */
export function QuantityStepper({ name, quantity, onAdd, onRemove, className }: Props) {
  const rootRef = useRef<HTMLSpanElement>(null)
  // Al pasar de "Añadir" a − 1 + (o al revés) el botón pulsado desaparece y el foco se perdería
  // (con teclado o lector de pantalla, volverías al principio de la página). Si el usuario estaba
  // aquí, se lleva el foco al botón equivalente del nuevo estado: "+" o "Añadir".
  const wasHere = useRef(false)
  const inList = quantity > 0
  useLayoutEffect(() => {
    if (!wasHere.current) return
    wasHere.current = false
    rootRef.current?.querySelector<HTMLButtonElement>('[data-focus-next]')?.focus()
  }, [inList])

  const press = (action: () => void) => () => {
    wasHere.current = true
    action()
  }

  return (
    <span ref={rootRef} className={cn('inline-flex h-11 w-[7.5rem] shrink-0', className)}>
      {!inList ? (
        <button
          type="button"
          data-focus-next
          onClick={press(onAdd)}
          aria-label={`Añadir ${name}`}
          className="flex size-full items-center justify-center gap-1.5 rounded-full border-2 border-primary text-sm font-bold text-primary outline-none transition-colors duration-150 hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Plus className="size-4" strokeWidth={2.75} aria-hidden="true" />
          Añadir
        </button>
      ) : (
        <span className="flex size-full items-center justify-between rounded-full bg-primary text-primary-foreground" role="group" aria-label={`${name}: ${quantity} en la lista`}>
          <button
            type="button"
            onClick={press(onRemove)}
            aria-label={quantity === 1 ? `Quitar ${name} de la lista` : `Quitar uno de ${name}`}
            className="grid h-full w-11 place-items-center rounded-l-full outline-none transition-colors duration-150 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-inset"
          >
            <Minus className="size-4" strokeWidth={2.75} aria-hidden="true" />
          </button>
          {/* key: el número "salta" al cambiar, para que se note que ha sumado */}
          <span key={quantity} className="animate-pop-in font-bold tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            data-focus-next
            onClick={press(onAdd)}
            aria-label={`Añadir otro ${name}`}
            className="grid h-full w-11 place-items-center rounded-r-full outline-none transition-colors duration-150 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-inset"
          >
            <Plus className="size-4" strokeWidth={2.75} aria-hidden="true" />
          </button>
        </span>
      )}
    </span>
  )
}
