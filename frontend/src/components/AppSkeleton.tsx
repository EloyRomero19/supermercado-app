import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

/** Esqueleto de una tarjeta de lista o de un bloque de contenido mientras carga. */
export function CardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-card p-4">
      <Skeleton className="size-12 rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  )
}

/** Esqueleto de una cuadrícula de productos. */
export function TilesSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2.5" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
      ))}
    </div>
  )
}

/** Pantalla completa mientras se recupera la sesión o carga una página: la forma de la app, sin datos. */
export function AppSkeleton({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col" aria-busy="true" aria-label={label} role="status">
      <div className="flex flex-col gap-3 border-b px-4 pb-4 pt-safe">
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <SlowHint />
        <Skeleton className="h-12 w-full rounded-xl" />
        <TilesSkeleton />
      </div>
    </div>
  )
}

/**
 * Si el servidor llevaba un rato sin uso, se apaga (Vercel lo hace a los 5 min) y la primera
 * petición espera a que vuelva a arrancar. Tras unos segundos lo explicamos, para que no parezca colgada.
 */
function SlowHint() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null
  return (
    <p className="rounded-xl bg-secondary px-4 py-3 text-center text-sm text-secondary-foreground">
      Despertando el servidor… La primera vez tras un rato sin uso tarda unos segundos.
    </p>
  )
}
