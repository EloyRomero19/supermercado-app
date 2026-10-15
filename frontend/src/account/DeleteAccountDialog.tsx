import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/useAuth'
import { FormAlert } from '@/components/FormAlert'
import { PasswordField } from '@/components/PasswordField'
import { SubmitButton } from '@/components/SubmitButton'
import { useSubmit } from '@/components/useSubmit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { onlyErrors } from '@/lib/validation'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

/**
 * Borrar la cuenta. Explica qué pasa con las listas y pide la contraseña: es irreversible y,
 * con la sesión abierta en un móvil ajeno, un solo toque no debería bastar.
 */
export function DeleteAccountDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <span className="mb-1 grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive" aria-hidden="true">
            <TriangleAlert className="size-6" />
          </span>
          <DialogTitle className="text-lg">¿Borrar tu cuenta?</DialogTitle>
          <DialogDescription>No se puede deshacer.</DialogDescription>
        </DialogHeader>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
          <li>Las listas en las que solo estás tú se borran con todo lo que tienen.</li>
          <li>Las compartidas siguen para los demás. Si eras el propietario, pasa a serlo quien lleve más tiempo en ella.</li>
          <li>Tu nombre deja de aparecer en lo que añadiste o cogiste.</li>
        </ul>
        {/* Dentro del contenido: Radix lo desmonta al cerrar, así la contraseña no se queda escrita */}
        <DeleteAccountForm />
      </DialogContent>
    </Dialog>
  )
}

function DeleteAccountForm() {
  const { deleteAccount } = useAuth()
  const [password, setPassword] = useState('')
  const { onSubmit, submitting, error, fieldErrors } = useSubmit(
    async () => {
      await deleteAccount(password)
      // Sin sesión, RequireAuth lleva al login solo
      toast.success('Tu cuenta se ha borrado. ¡Gracias por usar ¿Qué falta?!')
    },
    () => onlyErrors({ password: password ? undefined : 'Escribe tu contraseña' }),
  )

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <FormAlert message={error && !fieldErrors.password ? error : null} />
      <PasswordField
        label="Tu contraseña, para confirmar"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
      />
      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11">
            Cancelar
          </Button>
        </DialogClose>
        <SubmitButton submitting={submitting} submittingLabel="Borrando…" variant="destructive" className="sm:min-w-36">
          Borrar mi cuenta
        </SubmitButton>
      </DialogFooter>
    </form>
  )
}
