import { ArrowLeft, Crown, LogOut, Trash2, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { getMyLists } from '@/api/lists'
import type { ListSummary } from '@/api/types'
import { deletionImpact } from '@/account/deletionImpact'
import { useAuth } from '@/auth/useAuth'
import { FormAlert } from '@/components/FormAlert'
import { PageHeader } from '@/components/PageHeader'
import { PasswordField } from '@/components/PasswordField'
import { SubmitButton } from '@/components/SubmitButton'
import { useSubmit } from '@/components/useSubmit'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { onlyErrors } from '@/lib/validation'

/**
 * Borrar la cuenta en una pantalla propia y no en un modal: en el móvil, al abrirse el teclado,
 * un modal fijo en el centro no se puede desplazar; una página sí. Enseña qué pasará con cada
 * una de tus listas y pide la contraseña para confirmar.
 */
export function DeleteAccountPage() {
  const { user, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const { onSubmit, submitting, error, fieldErrors } = useSubmit(
    async () => {
      await deleteAccount(password)
      toast.success('Tu cuenta se ha borrado. ¡Gracias por usar ¿Qué falta?!')
      navigate('/login', { replace: true })
    },
    () => onlyErrors({ password: password ? undefined : 'Escribe tu contraseña' }),
  )

  return (
    <div className="mx-auto min-h-dvh w-full max-w-xl">
      <PageHeader
        title="Borrar cuenta"
        leading={
          <Button asChild variant="ghost" size="icon" className="size-11" aria-label="Volver a Cuenta">
            <Link to="/cuenta">
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <main className="flex flex-col gap-4 p-4 pb-safe">
        <Card className="flex-row gap-3 border-destructive/30 bg-destructive/5 px-4 py-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="flex min-w-0 flex-col gap-1 text-sm leading-relaxed">
            <p className="font-semibold text-destructive">No se puede deshacer</p>
            <p>
              Se borrará la cuenta <span className="font-semibold break-all">{user?.email}</span> con tus datos. Si
              vuelves, tendrás que crear una cuenta nueva.
            </p>
          </div>
        </Card>

        <ListsImpact />

        <Card className="px-4 py-5">
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <FormAlert message={error && !fieldErrors.password ? error : null} />
            <PasswordField
              label="Tu contraseña"
              hint="Para confirmar que eres tú."
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
            />
            <SubmitButton submitting={submitting} submittingLabel="Borrando…" variant="destructive" className="w-full">
              <Trash2 aria-hidden="true" />
              Borrar mi cuenta para siempre
            </SubmitButton>
            <Button asChild variant="outline" className="h-11 w-full">
              <Link to="/cuenta">Cancelar</Link>
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
}

/** Qué pasará con TUS listas (no solo las reglas en general): ayuda a decidir con conocimiento. */
function ListsImpact() {
  const [lists, setLists] = useState<ListSummary[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let ignore = false
    getMyLists()
      .then((result) => !ignore && setLists(result))
      .catch(() => !ignore && setFailed(true))
    return () => {
      ignore = true
    }
  }, [])

  const impact = lists && deletionImpact(lists)
  const shared = impact && impact.handedOver.length + impact.left.length > 0

  return (
    <Card className="gap-4 px-4 py-5">
      <h2 className="font-semibold">Qué pasará con tus listas</h2>

      {!lists && !failed && (
        <div className="flex flex-col gap-3" aria-label="Cargando tus listas">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      )}

      {/* Sin poder cargarlas, al menos las reglas */}
      {failed && (
        <ul className="flex flex-col gap-3">
          <ImpactRow Icon={Trash2} tone="destructive" title="Las que solo usas tú se borran" detail="Con todos sus productos." />
          <ImpactRow Icon={Crown} title="Las compartidas siguen para los demás" detail="Si eras el propietario, pasa a serlo quien lleve más tiempo en ella." />
        </ul>
      )}

      {impact && lists.length === 0 && <p className="text-sm text-muted-foreground">No tienes ninguna lista.</p>}

      {impact && lists.length > 0 && (
        <ul className="flex flex-col gap-3">
          {impact.deleted.length > 0 && (
            <ImpactRow Icon={Trash2} tone="destructive" title="Se borrarán, con sus productos" names={impact.deleted} />
          )}
          {impact.handedOver.length > 0 && (
            <ImpactRow
              Icon={Crown}
              title="Pasarán a otra persona"
              detail="Las heredará quien lleve más tiempo en cada una."
              names={impact.handedOver}
            />
          )}
          {impact.left.length > 0 && <ImpactRow Icon={LogOut} title="Saldrás de ellas" names={impact.left} />}
        </ul>
      )}

      {shared && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          En las listas compartidas, tu nombre dejará de aparecer en lo que añadiste o cogiste.
        </p>
      )}
    </Card>
  )
}

type ImpactRowProps = { Icon: LucideIcon; title: string; detail?: string; names?: string[]; tone?: 'destructive' }

function ImpactRow({ Icon, title, detail, names, tone }: ImpactRowProps) {
  return (
    <li className="flex gap-3">
      <span
        className={
          tone === 'destructive'
            ? 'grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive'
            : 'grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary'
        }
        aria-hidden="true"
      >
        <Icon className="size-4.5" />
      </span>
      <div className="flex min-w-0 flex-col gap-1.5 pt-1.5">
        <p className="text-sm font-medium">{title}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        {names && (
          <div className="flex flex-wrap gap-1.5">
            {names.map((name, i) => (
              <span key={`${name}-${i}`} className="max-w-full truncate rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}
