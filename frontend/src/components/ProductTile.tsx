import { useRef, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'
import { productDrawing } from '@/products/drawings'

/** need = está en la lista (teja); stock = se puede añadir (azul pizarra). */
export type TileTone = 'need' | 'stock'

type Props = {
  name: string
  categoryName: string | null
  tone: TileTone
  /** Texto que dice qué pasa al tocarla ("Quitar Pan de la lista") */
  label: string
  onClick: () => void
  /** Mantener pulsado (o clic derecho): más opciones. Si se pasa, también hay un botón para teclado. */
  onLongPress?: () => void
  /** Nota del producto, bajo el nombre */
  note?: string | null
  /** Unidades: si son más de una, se ven en una esquina */
  quantity?: number
  /** Ver lib/viewTransition.ts: la ficha "viaja" entre rejillas al añadirla o quitarla */
  transitionName?: string
  busy?: boolean
}

const TONES: Record<TileTone, string> = {
  need: 'bg-need hover:bg-need-hover',
  stock: 'bg-stock hover:bg-stock-hover',
}

const LONG_PRESS_MS = 450
/** Si el dedo se mueve más que esto, está desplazando la página: no es una pulsación larga */
const MOVE_TOLERANCE_PX = 10

/**
 * Ficha cuadrada de un producto: su dibujo de tiza y el nombre debajo, sobre un color que dice si
 * falta (teja) o se puede añadir (azul). Toda la ficha es el botón.
 */
export function ProductTile({ name, categoryName, tone, label, onClick, onLongPress, note, quantity = 1, transitionName, busy }: Props) {
  const press = useLongPress(onLongPress)

  return (
    <li className="relative" style={transitionName ? ({ viewTransitionName: transitionName } as CSSProperties) : undefined}>
      <button
        type="button"
        aria-label={label}
        aria-busy={busy || undefined}
        disabled={busy}
        onClick={() => {
          if (press.consumeClick()) return
          onClick()
        }}
        {...press.handlers}
        className={cn(
          'flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg px-1.5 pt-2 pb-2.5 text-center text-foreground outline-none select-none [-webkit-touch-callout:none]',
          'transition-[background-color,transform] duration-150 active:scale-[0.96] focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-60',
          TONES[tone],
        )}
      >
        <img src={productDrawing(name, categoryName)} alt="" decoding="async" draggable={false} className="pointer-events-none size-[52%] min-h-0" />
        <span className="line-clamp-2 w-full text-sm leading-tight font-semibold break-words">{name}</span>
        {note && <span className="-mt-0.5 w-full truncate text-xs opacity-85">{note}</span>}
      </button>

      {quantity > 1 && (
        <span
          className="pointer-events-none absolute top-1.5 right-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-foreground px-1.5 text-xs font-bold text-background tabular-nums"
          aria-hidden="true"
        >
          {quantity}
        </span>
      )}

      {/* Con teclado o lector de pantalla no se puede "mantener pulsado": este botón hace lo mismo.
          Invisible hasta que recibe el foco, para no llenar la ficha de iconos. */}
      {onLongPress && (
        <button
          type="button"
          onClick={onLongPress}
          className="sr-only rounded-full bg-background px-3 py-1.5 text-xs font-semibold focus:not-sr-only focus:absolute focus:top-1.5 focus:left-1.5 focus:outline-3 focus:outline-ring"
        >
          Cantidad y nota de {name}
        </button>
      )}
    </li>
  )
}

/**
 * Pulsación larga con el dedo (temporizador entre pointerdown y pointerup) y clic derecho
 * (contextmenu). En Android la pulsación larga dispara las dos cosas: firedAt evita abrir dos veces.
 * Después de una pulsación larga el navegador aún envía el "click" al soltar: consumeClick lo
 * descarta (solo si llega justo después; un clic posterior ya es otro toque).
 */
function useLongPress(onLongPress?: () => void) {
  const timer = useRef<number | undefined>(undefined)
  const start = useRef<{ x: number; y: number } | null>(null)
  const firedAt = useRef(0)
  const justFired = () => Date.now() - firedAt.current < 1000

  const cancel = () => {
    window.clearTimeout(timer.current)
    start.current = null
  }
  const fire = () => {
    if (justFired() || !onLongPress) return
    firedAt.current = Date.now()
    cancel()
    navigator.vibrate?.(10)
    onLongPress()
  }

  return {
    consumeClick: () => {
      const wasLong = justFired()
      firedAt.current = 0
      return wasLong
    },
    handlers: onLongPress
      ? {
          onPointerDown: (e: PointerEvent) => {
            if (e.button !== 0) return
            start.current = { x: e.clientX, y: e.clientY }
            timer.current = window.setTimeout(fire, LONG_PRESS_MS)
          },
          onPointerMove: (e: PointerEvent) => {
            if (start.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > MOVE_TOLERANCE_PX) cancel()
          },
          onPointerUp: cancel,
          onPointerCancel: cancel,
          onPointerLeave: cancel,
          onContextMenu: (e: MouseEvent) => {
            e.preventDefault()
            fire()
          },
        }
      : {},
  }
}
