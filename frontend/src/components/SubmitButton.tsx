import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  submitting: boolean
  children: ReactNode
  submittingLabel: string
  className?: string
  disabled?: boolean
  variant?: 'default' | 'destructive'
}

/** Botón de envío con indicador de carga; se desactiva mientras se envía para no mandarlo dos veces. */
export function SubmitButton({ submitting, children, submittingLabel, className, disabled = false, variant = 'default' }: Props) {
  return (
    <Button type="submit" size="lg" variant={variant} className={cn('h-11 text-base', className)} disabled={submitting || disabled} aria-busy={submitting}>
      {submitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {submitting ? submittingLabel : children}
    </Button>
  )
}
