import { Download, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { needsIosInstallHint, useInstallPrompt } from './installPrompt'

export function InstallCard() {
  const install = useInstallPrompt()
  if (!install && !needsIosInstallHint()) return null

  return (
    <Card className="flex-row items-center gap-4 px-4 py-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
        <Download className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold">Instala la app</h2>
        {install ? (
          <p className="text-sm text-muted-foreground">Ábrela desde la pantalla de inicio, como cualquier app.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            En Safari, pulsa <Share className="inline size-4 align-text-bottom" aria-label="Compartir" /> y luego «Añadir a
            pantalla de inicio».
          </p>
        )}
      </div>
      {install && (
        <Button onClick={install} className="h-11">
          Instalar
        </Button>
      )}
    </Card>
  )
}
