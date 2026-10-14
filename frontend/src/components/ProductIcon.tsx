import type { CSSProperties } from 'react'
import { categoryStyle } from '@/items/categoryStyle'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: 'size-9 rounded-lg text-xl',
  md: 'size-11 rounded-xl text-2xl',
  lg: 'size-16 rounded-2xl text-4xl',
}

type Props = {
  icon: string | null
  categoryName: string | null
  size?: keyof typeof SIZES
  className?: string
}

/** El emoji del producto sobre una ficha del color de su sección (o el de la sección si no tiene). */
export function ProductIcon({ icon, categoryName, size = 'md', className }: Props) {
  const style = categoryStyle(categoryName)
  return (
    <span
      className={cn('inline-grid shrink-0 place-items-center leading-none bg-tone-soft', SIZES[size], className)}
      // Variable CSS por elemento: la usa la utilidad bg-tone-soft (color-mix) para teñir el fondo
      style={{ '--tone': style.color } as CSSProperties}
      aria-hidden="true"
    >
      {icon ?? style.icon}
    </span>
  )
}
