import { useRef, useState, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'

type Options = { title: string; description?: string; confirmLabel?: string; destructive?: boolean }

/**
 * Diálogo de confirmación con el estilo de la app, usable como window.confirm:
 *   const { confirm, confirmDialog } = useConfirm()
 *   if (!(await confirm({ title: '¿Borrar la lista?' }))) return
 * confirmDialog hay que pintarlo en el componente (es el diálogo en sí).
 */
export function useConfirm() {
  const [options, setOptions] = useState<Options | null>(null)
  const resolver = useRef<(value: boolean) => void>(null)

  const confirm = (next: Options) =>
    new Promise<boolean>((resolve) => {
      resolver.current = resolve
      setOptions(next)
    })

  const close = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }

  const confirmDialog: ReactNode = (
    <AlertDialog open={options !== null} onOpenChange={(open) => !open && close(false)}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          {options?.description && <AlertDialogDescription>{options.description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11" onClick={() => close(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: options?.destructive ? 'destructive' : 'default', className: 'h-11' })}
            onClick={() => close(true)}
          >
            {options?.confirmLabel ?? 'Aceptar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return { confirm, confirmDialog }
}
