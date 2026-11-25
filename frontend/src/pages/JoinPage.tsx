import { LoaderCircle, UserRoundX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '@/api/client'
import { joinList } from '@/api/lists'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'

/**
 * Destino del enlace de invitación (/unirse/K7MX4QPA). Es una ruta protegida: si no hay sesión,
 * RequireAuth manda a /login y, tras entrar, GuestOnly devuelve aquí para completar la unión.
 */
export function JoinPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    joinList(code)
      .then((list) => !ignore && navigate(`/listas/${list.id}`, { replace: true }))
      .catch((e: unknown) => !ignore && setError(e instanceof ApiError ? e.message : 'No se pudo unir a la lista'))
    return () => {
      ignore = true
    }
  }, [code, navigate])

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-[max(2rem,env(safe-area-inset-top))]">
      {error ? (
        <EmptyState
          icon={<UserRoundX />}
          title="No se pudo unir a la lista"
          description={error}
          action={
            <Button asChild>
              <Link to="/">Ir a mis listas</Link>
            </Button>
          }
        />
      ) : (
        <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden="true" />
          Uniéndote a la lista…
        </div>
      )}
    </main>
  )
}
