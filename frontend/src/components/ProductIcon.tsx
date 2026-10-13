import type { CSSProperties } from 'react'
import { categoryStyle } from '../items/categoryStyle'

type Props = {
  icon: string | null
  categoryName: string | null
  size?: 'sm' | 'md' | 'lg'
}

/** El emoji del producto sobre una ficha del color de su sección (o el de la sección si no tiene). */
export function ProductIcon({ icon, categoryName, size = 'md' }: Props) {
  const style = categoryStyle(categoryName)
  return (
    <span
      className={`product-icon product-icon-${size}`}
      // Variable CSS por elemento: la usa color-mix() en index.css para teñir el fondo
      style={{ '--tone': style.color } as CSSProperties}
      aria-hidden="true"
    >
      {icon ?? style.icon}
    </span>
  )
}
