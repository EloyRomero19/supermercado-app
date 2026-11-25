import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

/** Esqueleto de una línea de lista (producto, receta…) mientras carga. */
export function RowSkeleton() {
  return (
    <div className="flex h-[4.5rem] items-center gap-3" aria-hidden="true">
      <Skeleton className="size-14 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

/** Pantalla completa mientras se recupera la sesión o carga una página: la forma de la app, sin datos. */
export function AppSkeleton({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="flex min-h-dvh w-full flex-col" aria-busy="true" aria-label={label} role="status">
      <div className="border-b bg-background px-4 pt-safe pb-3">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
          <div className="flex h-11 items-center gap-2">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-4">
        <SlowHint />
        <Skeleton className="h-8 w-36 rounded-full" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="divide-y">
          {[0, 1, 2, 3, 4].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
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
    <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
      Conectando con el servidor. Si llevaba un rato sin uso, tarda unos segundos en arrancar.
    </p>
  )
}
