import { Link2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { ApiError } from '@/api/client'
import { getMyLists } from '@/api/lists'
import type { ListSummary } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { AppSkeleton } from '@/components/AppSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { FormAlert } from '@/components/FormAlert'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { JoinListDialog } from '@/lists/JoinListDialog'
import { lastListId } from '@/lists/lastList'
import { NewListDialog } from '@/lists/NewListDialog'
import { pickListToShop } from '@/lists/pickListToShop'

/**
 * Pestaña "Listas": abre directamente la lista que estás usando (la última que abriste o, si no,
 * la que tiene más por comprar). Las demás se cambian desde el título ("Mis listas ▾").
 * Solo si aún no tienes ninguna se queda aquí, para crear una o unirte.
 */
export function HomePage() {
  const { user } = useAuth()
  const [lists, setLists] = useState<ListSummary[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'new' | 'join' | null>(null)

  useEffect(() => {
    // "ignore" evita guardar una respuesta si el componente ya se desmontó (o en el doble efecto de StrictMode)
    let ignore = false
    getMyLists()
      .then((result) => !ignore && setLists(result))
      .catch((error: unknown) => !ignore && setLoadError(error instanceof ApiError ? error.message : 'Error al cargar tus listas'))
    return () => {
      ignore = true
    }
  }, [])

  const main = lists && pickListToShop(lists, lastListId())
  // replace: así "atrás" no vuelve a esta página de paso
  if (main) return <Navigate to={`/listas/${main.id}`} replace />
  if (!lists && !loadError) return <AppSkeleton label="Cargando tus listas" />

  const firstName = user?.displayName.split(' ')[0] ?? ''

  return (
    <>
      <PageHeader title={`Hola, ${firstName} 👋`}>
        <p className="text-sm text-muted-foreground">¿Qué toca comprar hoy?</p>
      </PageHeader>

      <main className="flex flex-1 flex-col gap-4 p-4">
        <FormAlert message={loadError} />
        {lists && (
          <EmptyState
            icon="🧺"
            title="Aún no tienes listas"
            description="Crea tu primera lista o únete a la de otra persona con su QR o su enlace."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="lg" onClick={() => setDialog('new')}>
                  <Plus aria-hidden="true" />
                  Crear una lista
                </Button>
                <Button size="lg" variant="outline" onClick={() => setDialog('join')}>
                  <Link2 aria-hidden="true" />
                  Unirme con un enlace
                </Button>
              </div>
            }
          />
        )}
      </main>

      <NewListDialog open={dialog === 'new'} onOpenChange={(open) => setDialog(open ? 'new' : null)} />
      <JoinListDialog open={dialog === 'join'} onOpenChange={(open) => setDialog(open ? 'join' : null)} />
    </>
  )
}
