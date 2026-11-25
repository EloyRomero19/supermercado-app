import { cn } from '@/lib/utils'

/**
 * La raya de tiza verde con la que se tacha un producto. Se "dibuja" de izquierda a derecha al
 * aparecer (animate-chalk-strike); quien pide menos movimiento la ve ya hecha. Decorativa: que
 * está tachado lo dice el botón (aria-pressed y su etiqueta).
 */
export function ChalkStrike({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 16"
      preserveAspectRatio="none"
      className={cn('chalk pointer-events-none absolute top-1/2 h-4 -translate-y-1/2 animate-chalk-strike text-primary', className)}
    >
      <path d="M3 10 C50 5 110 12 170 7 C220 3 260 9 297 6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
