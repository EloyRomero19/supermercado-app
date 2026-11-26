import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { prefersReducedMotion } from '@/lib/viewTransition'
import { productDrawing } from '@/products/drawings'

const DEMO_ITEMS = [
  { name: 'Pan de barra', category: 'Panadería y bollería' },
  { name: 'Tomate', category: 'Frutas y verduras' },
  { name: 'Leche entera', category: 'Lácteos y huevos' },
]

/** Cuándo se coge el primero tras abrir la página: lo justo para que se vea la lista quieta. */
const TAKE_MS = 1400
/** Lo que tarda la ficha en irse (igual que la transición de CSS de abajo). */
const LEAVE_MS = 220

type Phase = 'shown' | 'leaving' | 'gone'

/**
 * Demostración de cómo funciona la app, en la pantalla de entrada: tres fichas de lo que falta y,
 * una sola vez, alguien coge el pan y su ficha desaparece. Explica la idea sin texto de más a quien
 * llega nuevo. Decorativa (aria-hidden): el texto de al lado ya lo cuenta.
 * Con "reducir movimiento" se ve directamente el resultado.
 */
export function ListDemo({ className }: { className?: string }) {
  const [phase, setPhase] = useState<Phase>(() => (prefersReducedMotion() ? 'gone' : 'shown'))

  useEffect(() => {
    if (phase === 'gone') return
    const timer = window.setTimeout(() => setPhase(phase === 'shown' ? 'leaving' : 'gone'), phase === 'shown' ? TAKE_MS : LEAVE_MS)
    return () => window.clearTimeout(timer)
  }, [phase])

  const items = phase === 'gone' ? DEMO_ITEMS.slice(1) : DEMO_ITEMS

  return (
    <div className={cn('rounded-2xl border-2 border-border p-4', className)} aria-hidden="true">
      <p className="chalk-title mb-3 text-3xl tabular-nums">Faltan {phase === 'gone' ? 2 : 3}</p>
      <ul className="grid grid-cols-3 gap-1.5">
        {items.map((item, index) => (
          <li
            key={item.name}
            className={cn(
              'flex aspect-square flex-col items-center justify-center gap-1 rounded-lg bg-need px-1.5 text-center transition-[opacity,transform] duration-200',
              index === 0 && phase === 'leaving' && 'scale-75 opacity-0',
            )}
          >
            <img src={productDrawing(item.name, item.category)} alt="" draggable={false} className="size-[52%]" />
            <span className="line-clamp-2 text-sm leading-tight font-semibold">{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
