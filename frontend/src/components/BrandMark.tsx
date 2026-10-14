import { cn } from '@/lib/utils'

/** Logo de la app (el mismo SVG que el icono de la PWA). */
export function BrandMark({ className }: { className?: string }) {
  return <img src="/favicon.svg" alt="" width={40} height={40} className={cn('size-10 rounded-xl shadow-sm', className)} />
}
