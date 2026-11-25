import { Share, SquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { needsIosInstallHint, useInstallPrompt } from './installPrompt'

/**
 * Opcional, en Cuenta: añadir la web a la pantalla de inicio para abrirla con un toque.
 * Solo aparece si el navegador lo permite (o en iPhone, con las instrucciones de Safari).
 */
export function InstallCard() {
  const install = useInstallPrompt()
  if (!install && !needsIosInstallHint()) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <SquarePlus className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h2 className="section-title">Acceso directo</h2>
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
        <Button variant="outline" onClick={install} className="h-11">
          Añadir
        </Button>
      )}
    </div>
  )
}
