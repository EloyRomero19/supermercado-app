import { ShoppingBasket } from 'lucide-react'
import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { createList } from '@/api/lists'
import { FormAlert } from '@/components/FormAlert'
import { SubmitButton } from '@/components/SubmitButton'
import { useSubmit } from '@/components/useSubmit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { onlyErrors } from '@/lib/validation'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

/** Modal para crear una lista nueva; al crearla, se abre. */
export function NewListDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <span className="mb-1 grid size-12 place-items-center rounded-2xl bg-secondary text-primary" aria-hidden="true">
            <ShoppingBasket className="size-6" />
          </span>
          <DialogTitle className="text-lg">Nueva lista</DialogTitle>
          <DialogDescription>Luego podrás compartirla con quien quieras.</DialogDescription>
        </DialogHeader>
        {/* Dentro del contenido: Radix lo desmonta al cerrar, así que cada vez empieza vacío */}
        <NewListForm />
      </DialogContent>
    </Dialog>
  )
}

function NewListForm() {
  const navigate = useNavigate()
  const inputId = useId()
  const [name, setName] = useState('')

  const create = useSubmit(
    async () => {
      const list = await createList(name)
      navigate(`/listas/${list.id}`)
    },
    () => onlyErrors({ name: name.trim() ? undefined : 'Ponle un nombre a la lista' }),
  )

  return (
    <form className="flex flex-col gap-4" onSubmit={create.onSubmit} noValidate>
      <FormAlert message={create.error && !create.fieldErrors.name ? create.error : null} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId}>Nombre</Label>
        <Input
          id={inputId}
          className="h-12 text-base"
          autoFocus
          aria-invalid={create.fieldErrors.name ? true : undefined}
          aria-describedby={create.fieldErrors.name ? `${inputId}-error` : undefined}
          placeholder="Casa, Piso de la playa…"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {create.fieldErrors.name && (
          <p id={`${inputId}-error`} className="text-sm font-medium text-destructive">
            {create.fieldErrors.name}
          </p>
        )}
      </div>
      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11">
            Cancelar
          </Button>
        </DialogClose>
        <SubmitButton submitting={create.submitting} submittingLabel="Creando…" className="sm:min-w-28">
          Crear lista
        </SubmitButton>
      </DialogFooter>
    </form>
  )
}
