/**
 * Icono y color de cada sección del supermercado. Es presentación pura, por eso vive en el
 * frontend (los iconos de cada producto sí vienen del backend). El color se usa con
 * color-mix() en CSS: el mismo valor sirve para el modo claro y el oscuro.
 */
type CategoryStyle = { icon: string; color: string }

const STYLES: Record<string, CategoryStyle> = {
  'Frutas y verduras': { icon: '🥕', color: '#2e9d4f' },
  Carnicería: { icon: '🥩', color: '#d64545' },
  Pescadería: { icon: '🐟', color: '#2b7bd6' },
  'Charcutería y quesos': { icon: '🧀', color: '#d99a00' },
  'Lácteos y huevos': { icon: '🥛', color: '#4f63d2' },
  'Panadería y bollería': { icon: '🥖', color: '#b8692e' },
  Despensa: { icon: '🥫', color: '#e0622a' },
  'Desayuno y dulces': { icon: '🍪', color: '#c2417e' },
  Congelados: { icon: '🧊', color: '#1a9fb0' },
  Bebidas: { icon: '🥤', color: '#7a4fd1' },
  Limpieza: { icon: '🧽', color: '#14907f' },
  'Higiene y cuidado personal': { icon: '🧴', color: '#a347b8' },
  'Bebé y mascotas': { icon: '🐾', color: '#d6880f' },
}

// Productos escritos a mano que el backend no ha sabido reconocer
const OTHER: CategoryStyle = { icon: '🛍️', color: '#6b7a72' }

export function categoryStyle(categoryName: string | null): CategoryStyle {
  return (categoryName && STYLES[categoryName]) || OTHER
}

/** Colores alegres para distinguir las listas entre sí en "Mis listas". */
const LIST_COLORS = ['#2e9d4f', '#2b7bd6', '#e0622a', '#7a4fd1', '#c2417e', '#14907f', '#d99a00']

export function listColor(index: number): string {
  return LIST_COLORS[index % LIST_COLORS.length]
}
