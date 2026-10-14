import { WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

/** Aviso fijo cuando el dispositivo se queda sin conexión (y desaparece solo al recuperarla). */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine)
  if (online) return null
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-foreground px-4 pb-2 pt-safe text-sm font-medium text-background"
    >
      <WifiOff className="size-4" aria-hidden="true" />
      Sin conexión. Los cambios no se guardarán hasta que vuelva.
    </div>
  )
}
