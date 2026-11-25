import { cn } from '@/lib/utils'
import { recipeDrawings } from '@/products/drawings'

/** Dónde va cada dibujo dentro de la ficha (en % del ancho/alto): el principal, grande y a la izquierda. */
const SPOTS = [
  'left-[6%] top-[14%] w-[56%] -rotate-6',
  'right-[6%] top-[6%] w-[40%] rotate-6',
  'right-[12%] bottom-[6%] w-[42%] -rotate-3',
]

/**
 * Ilustración de una receta: sus ingredientes principales dibujados y amontonados, como sobre la
 * encimera antes de cocinar. Decorativa: el nombre de la receta va al lado.
 */
export function RecipeArt({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('relative block overflow-hidden rounded-lg border-2 border-border', className)} aria-hidden="true">
      {/* La composición va en un cuadrado centrado: así sirve igual en una ficha cuadrada que apaisada */}
      <span className="absolute inset-y-0 left-1/2 aspect-square h-full -translate-x-1/2">
        {recipeDrawings(name).map((src, index) => (
          <img key={src} src={src} alt="" decoding="async" draggable={false} className={cn('absolute aspect-square', SPOTS[index])} />
        ))}
      </span>
    </span>
  )
}
