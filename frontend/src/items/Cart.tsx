import { CheckCheck, ChevronUp, ShoppingCart, Undo2 } from 'lucide-react'
import { useState } from 'react'
import type { Item } from '@/api/types'
import { BottomSheet } from '@/components/BottomSheet'
import { ProductIcon } from '@/components/ProductIcon'
import { Button } from '@/components/ui/button'

type Props = {
  items: Item[]
  onReturn: (item: Item) => void
  onFinish: () => void
}

/**
 * El carrito, como en una tienda online: una barra fija abajo con lo que ya habéis cogido
 * (da un saltito cada vez que entra algo) y, al tocarla, un panel para devolver productos
 * o terminar la compra. Así la lista de arriba muestra solo lo que falta.
 */
export function Cart({ items, onReturn, onFinish }: Props) {
  const [open, setOpen] = useState(false)
  const inCart = items.filter((item) => item.checked)

  // Si el carrito se queda vacío (p. ej. otro miembro termina la compra), el panel se cierra;
  // si no, se volvería a abrir solo al meter el siguiente producto
  if (inCart.length === 0 && open) setOpen(false)
  if (inCart.length === 0) return null

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-above-tabbar z-30 px-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Ver el carrito: ${inCart.length} ${inCart.length === 1 ? 'producto' : 'productos'}`}
          className="pointer-events-auto mx-auto flex h-14 w-full max-w-[calc(36rem-2rem)] items-center gap-3 rounded-2xl bg-primary px-4 text-primary-foreground shadow-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98] motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:transition-transform"
        >
          {/* key = cantidad: al cambiar se vuelve a montar y repite la animación "pop" */}
          <span key={inCart.length} className="relative motion-safe:animate-pop" aria-hidden="true">
            <ShoppingCart className="size-6" />
            <span className="absolute -top-2 -right-2.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary-foreground px-1 text-xs font-bold text-primary tabular-nums">
              {inCart.length}
            </span>
          </span>
          <span className="ml-1 flex-1 text-left font-semibold">En tu carrito</span>
          <span className="flex items-center gap-1 text-sm font-medium opacity-90">
            Ver
            <ChevronUp className="size-4" aria-hidden="true" />
          </span>
        </button>
      </div>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Tu carrito"
        description="Lo que ya habéis cogido. ¿Te has equivocado? Devuélvelo a la lista."
      >
        <ul className="flex flex-col divide-y">
          {inCart.map((item) => (
            <li key={item.id} className="flex min-h-14 items-center gap-3 py-1.5">
              <ProductIcon icon={item.icon} categoryName={item.categoryName} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">
                  {item.name}
                  {item.quantity > 1 && <span className="font-bold"> ×{item.quantity}</span>}
                </span>
                {item.checkedByName && <span className="truncate text-xs text-muted-foreground">Lo cogió {item.checkedByName}</span>}
              </span>
              <Button variant="outline" size="sm" className="h-10" onClick={() => onReturn(item)} aria-label={`Devolver ${item.name} a la lista`}>
                <Undo2 aria-hidden="true" />
                Devolver
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 pt-2">
          <Button size="lg" className="h-12 text-base" onClick={onFinish}>
            <CheckCheck aria-hidden="true" />
            Terminar la compra
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Quita de la lista lo que ya está en el carrito. Lo que falte se queda para la próxima vez.
          </p>
        </div>
      </BottomSheet>
    </>
  )
}
