import { QrCode } from 'lucide-react'
import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { joinList } from '@/api/lists'
import { FormAlert } from '@/components/FormAlert'
import { SubmitButton } from '@/components/SubmitButton'
import { useSubmit } from '@/components/useSubmit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { onlyErrors } from '@/lib/validation'
import { extractInviteCode } from './invite'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

/**
 * Modal para unirse a una lista pegando el enlace de invitación. El formulario vive dentro del
 * contenido del Dialog, que Radix desmonta al cerrarse: al volver a abrirlo empieza vacío y sin
 * errores, sin tener que limpiarlo a mano.
 */
export function JoinListDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold">Unirse a una lista</DialogTitle>
          <DialogDescription>¿Te han enviado una invitación? Pega aquí el enlace.</DialogDescription>
        </DialogHeader>
        <JoinForm />
      </DialogContent>
    </Dialog>
  )
}

function JoinForm() {
  const navigate = useNavigate()
  const inputId = useId()
  const [inviteLink, setInviteLink] = useState('')

  const join = useSubmit(
    async () => {
      const list = await joinList(extractInviteCode(inviteLink) ?? '')
      navigate(`/listas/${list.id}`)
    },
    () => onlyErrors({ code: extractInviteCode(inviteLink) ? undefined : 'Eso no parece un enlace de invitación. Pega el enlace completo.' }),
  )

  return (
    <form className="flex flex-col gap-4" onSubmit={join.onSubmit} noValidate>
      <FormAlert message={join.error && !join.fieldErrors.code ? join.error : null} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId}>Enlace de invitación</Label>
        <Input
          id={inputId}
          className="h-12 text-base"
          inputMode="url"
          autoFocus
          aria-invalid={join.fieldErrors.code ? true : undefined}
          aria-describedby={join.fieldErrors.code ? `${inputId}-error` : undefined}
          placeholder="https://…/unirse/K7MX4QPA"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={inviteLink}
          onChange={(e) => setInviteLink(e.target.value)}
        />
        {join.fieldErrors.code && (
          <p id={`${inputId}-error`} className="text-sm font-medium text-destructive">
            {join.fieldErrors.code}
          </p>
        )}
      </div>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <QrCode className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        ¿Tienes el QR? Escanéalo con la cámara del móvil y se abrirá la invitación directamente.
      </p>

      <DialogFooter className="grid grid-cols-2 gap-2 sm:flex">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11">
            Cancelar
          </Button>
        </DialogClose>
        <SubmitButton submitting={join.submitting} submittingLabel="Uniendo…" className="sm:min-w-28">
          Unirse
        </SubmitButton>
      </DialogFooter>
    </form>
  )
}
