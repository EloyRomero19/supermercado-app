import { flushSync } from 'react-dom'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Aplica un cambio de estado de React animando las fichas que cambian de sitio (View Transitions).
 * El navegador hace una "foto" antes, aplicamos el cambio (flushSync: React pinta YA, no más tarde)
 * y anima cada elemento con el mismo view-transition-name de su posición vieja a la nueva.
 * Sin soporte (navegadores antiguos) o con "reducir movimiento", el cambio se aplica sin más.
 */
export function withViewTransition(update: () => void) {
  if (typeof document === 'undefined' || !document.startViewTransition || prefersReducedMotion()) {
    update()
    return
  }
  document.startViewTransition(() => flushSync(update))
}

/**
 * Nombre de transición de la ficha de un producto. Es el MISMO para su ficha en "Otras veces" y en
 * lo que falta: por eso, al añadirlo, el navegador la ve como un único elemento que se mueve.
 * Tiene que ser un identificador CSS válido y único en la página, así que lo escrito a mano se
 * resume con un hash (no puede llevar espacios ni tildes).
 */
export function tileTransitionName(productId: number | null, name: string): string {
  if (productId !== null) return `tile-p${productId}`
  let hash = 5381
  for (const char of name.trim().toLowerCase()) hash = ((hash * 33) ^ char.charCodeAt(0)) >>> 0
  return `tile-c${hash.toString(36)}`
}
