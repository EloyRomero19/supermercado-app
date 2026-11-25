import { cn } from '@/lib/utils'
import { productDrawing } from '@/products/drawings'

const SIZES = {
  xs: 'size-8',
  sm: 'size-11',
  md: 'size-14',
  lg: 'size-18',
}

type Props = {
  name: string
  categoryName: string | null
  size?: keyof typeof SIZES
  /** Unidades: si son más de una, se ven en una esquina del dibujo */
  quantity?: number
  className?: string
}

/**
 * Dibujo de tiza del producto (public/dibujos, ver products/drawings.ts), directamente sobre la
 * pizarra, sin ficha. Es decorativo (alt=""): el nombre del producto ya está escrito al lado.
 */
export function ProductDrawing({ name, categoryName, size = 'sm', quantity = 1, className }: Props) {
  return (
    <span className={cn('relative grid shrink-0 place-items-center', SIZES[size], className)} aria-hidden="true">
      <img src={productDrawing(name, categoryName)} alt="" decoding="async" draggable={false} className="size-full" />
      {quantity > 1 && (
        <span className="absolute -right-1.5 -bottom-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs leading-none font-bold text-primary-foreground tabular-nums">
          {quantity}
        </span>
      )}
    </span>
  )
}
