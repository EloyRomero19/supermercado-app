import { Share, SquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { needsIosInstallHint, useInstallPrompt } from './installPrompt'

/**
 * Opcional, en Cuenta: añadir la web a la pantalla de inicio para abrirla con un toque.
 * Solo aparece si el navegador lo permite (o en iPhone, con las instrucciones de Safari).
 */
export function InstallCard() {
  const install = useInstallPrompt()
  if (!install && !needsIosInstallHint()) return null

  return (
    <Card className="flex-row items-center gap-4 px-4 py-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
        <SquarePlus className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold">Acceso directo</h2>
        {install ? (
          <p className="text-sm text-muted-foreground">Añádela a la pantalla de inicio y ábrela con un toque.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            En Safari, pulsa <Share className="inline size-4 align-text-bottom" aria-label="Compartir" /> y luego «Añadir a
            pantalla de inicio».
          </p>
        )}
      </div>
      {install && (
        <Button onClick={install} className="h-11">
          Añadir
        </Button>
      )}
    </Card>
  )
}
