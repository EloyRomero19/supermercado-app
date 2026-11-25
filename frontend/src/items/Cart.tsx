import { ShoppingBasket, Undo2 } from 'lucide-react'
import type { Item } from '@/api/types'
import { BottomSheet } from '@/components/BottomSheet'
import { ProductDrawing } from '@/components/ProductDrawing'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PanelProps = {
  items: Item[]
  onReturn: (item: Item) => void
  onFinish: () => void
  className?: string
}

/**
 * La cesta de la cabecera, con cuántos productos hay tachados (en verde: lo hecho).
 * key={count}: al cambiar el número, el contador se vuelve a montar y repite su salto, también si
 * lo ha tachado otra persona.
 */
export function CartButton({ count, onClick, className }: { count: number; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver lo tachado: ${count} ${count === 1 ? 'producto' : 'productos'}`}
      className={cn(
        'relative grid size-12 shrink-0 place-items-center rounded-full text-foreground outline-none transition-colors duration-150 hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/60',
        className,
      )}
    >
      <ShoppingBasket className="chalk size-7" strokeWidth={1.75} aria-hidden="true" />
      {count > 0 && (
        <span
          key={count}
          className="absolute top-0.5 right-0 grid h-5.5 min-w-5.5 animate-bump place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground tabular-nums"
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </button>
  )
}

/**
 * Lo tachado (lo que ya va en la cesta), con opción de quitarle la raya, y el botón de terminar la
 * compra, que lo borra de la pizarra. En el panel que sube (móvil) y en la columna lateral (escritorio).
 */
export function CartPanel({ items, onReturn, onFinish, className }: PanelProps) {
  const inCart = items.filter((item) => item.checked)
  const pending = items.length - inCart.length

  return (
    <div className={cn('flex flex-col', className)}>
      {inCart.length === 0 ? (
        <p className="py-2 text-muted-foreground">Aún no has tachado nada. Cuando cojas algo, tócalo en la lista.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {inCart.map((item) => (
            <li key={item.id} className="flex min-h-16 items-center gap-3 py-2">
              <ProductDrawing name={item.name} categoryName={item.categoryName} quantity={item.quantity} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{item.name}</span>
                {item.checkedByName && <span className="truncate text-sm text-muted-foreground">Lo tachó {item.checkedByName}</span>}
              </span>
              <Button variant="ghost" className="h-11 px-3 text-primary hover:text-primary" onClick={() => onReturn(item)} aria-label={`Quitar la raya a ${item.name}`}>
                <Undo2 aria-hidden="true" />
                Quitar raya
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Fijo abajo aunque la lista sea larga */}
      <div className="sticky bottom-0 -mx-5 mt-3 border-t bg-card px-5 pt-3 pb-2">
        <p className="mb-3 text-sm text-muted-foreground">
          {pending === 0 ? 'No queda nada por coger.' : `Faltan ${pending}: se quedan en la pizarra para la próxima vez.`}
        </p>
        <Button size="lg" className="w-full" disabled={inCart.length === 0} onClick={onFinish}>
          Terminar la compra
        </Button>
      </div>
    </div>
  )
}

/** Lo tachado en un panel que sube desde abajo (móvil y pantallas medianas). */
export function CartSheet({ open, onClose, ...panel }: PanelProps & { open: boolean; onClose: () => void }) {
  const count = panel.items.filter((item) => item.checked).length
  return (
    <BottomSheet open={open} onClose={onClose} title="En la cesta" description={count === 0 ? 'Nada tachado todavía' : `${count} ${count === 1 ? 'producto tachado' : 'productos tachados'}`}>
      <CartPanel {...panel} />
    </BottomSheet>
  )
}
