import { ShoppingBasket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChalkStrike } from './ChalkStrike'
import { ProductDrawing } from './ProductDrawing'

const DEMO_ITEMS = [
  { name: 'Tomate', category: 'Frutas y verduras', note: 'Maduros, para ensalada', quantity: 4 },
  { name: 'Leche entera', category: 'Lácteos y huevos', note: null, quantity: 6 },
  { name: 'Pan de barra', category: 'Panadería y bollería', note: null, quantity: 1 },
]

/** Cuándo se tacha el primero tras abrir la página: lo justo para que se vea la lista quieta. */
const STRIKE_MS = 1400

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Demostración de cómo funciona la app, en la pantalla de entrada: una pizarra pequeña en la que,
 * una sola vez, alguien coge los tomates y quedan tachados. Explica la idea sin texto de más a
 * quien llega nuevo. Decorativa (aria-hidden): el texto de al lado ya lo cuenta.
 * Con "reducir movimiento" se ve directamente el resultado.
 */
export function ListDemo({ className }: { className?: string }) {
  const [struck, setStruck] = useState(reducedMotion)

  useEffect(() => {
    if (struck) return
    const timer = window.setTimeout(() => setStruck(true), STRIKE_MS)
    return () => window.clearTimeout(timer)
  }, [struck])

  return (
    <div className={cn('rounded-2xl border-2 border-border p-4', className)} aria-hidden="true">
      <div className="mb-1 flex items-center justify-between">
        <p className="chalk-title text-3xl tabular-nums">Faltan {struck ? 2 : 3}</p>
        <span className="relative grid size-11 place-items-center">
          <ShoppingBasket className="chalk size-7" strokeWidth={1.75} />
          {struck && (
            <span className="absolute top-0 -right-1 grid size-5.5 animate-bump place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
          )}
        </span>
      </div>
      <ul>
        {DEMO_ITEMS.map((item, index) => {
          const crossed = index === 0 && struck
          return (
            <li key={item.name} className="relative flex min-h-16 items-center gap-4 py-1.5">
              <ProductDrawing name={item.name} categoryName={item.category} quantity={item.quantity} size="md" className={cn('transition-opacity duration-200', crossed && 'opacity-40')} />
              <span className="flex min-w-0 flex-col">
                <span className="relative max-w-full self-start">
                  <span className={cn('block truncate text-lg font-semibold transition-opacity duration-200', crossed && 'opacity-50')}>{item.name}</span>
                  {crossed && <ChalkStrike className="-left-1.5 w-[calc(100%+0.75rem)]" />}
                </span>
                {item.note && <span className={cn('truncate text-sm text-muted-foreground', crossed && 'opacity-50')}>{item.note}</span>}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
