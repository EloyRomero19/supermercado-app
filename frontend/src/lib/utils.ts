import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Une clases de Tailwind resolviendo conflictos: cn('px-2', cond && 'px-4') → 'px-4'.
 * La usan todos los componentes de shadcn/ui para aceptar un className extra desde fuera.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
