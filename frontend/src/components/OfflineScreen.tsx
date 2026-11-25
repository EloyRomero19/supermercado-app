import { WifiOff } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { EmptyState } from './EmptyState'

/** Al abrir la app sin red no sabemos si hay sesión: mejor decirlo que mandar al login. */
export function OfflineScreen() {
  const { retry } = useAuth()
  return (
    <main className="mx-auto w-full max-w-md px-4 pt-[max(2rem,env(safe-area-inset-top))]">
      <EmptyState
        icon={<WifiOff />}
        title="Sin conexión"
        description="No se puede conectar con el servidor. Comprueba tu conexión a internet y vuelve a intentarlo."
        action={
          <Button onClick={retry}>
            Reintentar
          </Button>
        }
      />
    </main>
  )
}
