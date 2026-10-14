/**
 * Icono y color de cada sección del supermercado. Es presentación pura, por eso vive en el
 * frontend (los iconos de cada producto vienen del backend). Los colores son tokens de
 * index.css (--cat-N): aquí solo se elige cuál corresponde a cada sección.
 */
type CategoryStyle = { icon: string; color: string }

const STYLES: Record<string, CategoryStyle> = {
  'Frutas y verduras': { icon: '🥕', color: 'var(--cat-1)' },
  Carnicería: { icon: '🥩', color: 'var(--cat-2)' },
  Pescadería: { icon: '🐟', color: 'var(--cat-3)' },
  'Charcutería y quesos': { icon: '🧀', color: 'var(--cat-4)' },
  'Lácteos y huevos': { icon: '🥛', color: 'var(--cat-5)' },
  'Panadería y bollería': { icon: '🥖', color: 'var(--cat-6)' },
  Despensa: { icon: '🥫', color: 'var(--cat-7)' },
  'Desayuno y dulces': { icon: '🍪', color: 'var(--cat-8)' },
  Congelados: { icon: '🧊', color: 'var(--cat-9)' },
  Bebidas: { icon: '🥤', color: 'var(--cat-10)' },
  Limpieza: { icon: '🧽', color: 'var(--cat-11)' },
  'Higiene y cuidado personal': { icon: '🧴', color: 'var(--cat-12)' },
  'Bebé y mascotas': { icon: '🐾', color: 'var(--cat-13)' },
}

export const OTHER_CATEGORY = 'Otros'
// Productos escritos a mano que el backend no ha sabido reconocer
const OTHER: CategoryStyle = { icon: '🛍️', color: 'var(--cat-other)' }

export function categoryStyle(categoryName: string | null): CategoryStyle {
  return (categoryName && STYLES[categoryName]) || OTHER
}

/** Colores para distinguir las listas entre sí en "Mis listas" (los mismos tokens de las secciones). */
const LIST_COLORS = ['var(--cat-1)', 'var(--cat-3)', 'var(--cat-7)', 'var(--cat-10)', 'var(--cat-8)', 'var(--cat-11)', 'var(--cat-4)']

export function listColor(index: number): string {
  return LIST_COLORS[index % LIST_COLORS.length]
}
