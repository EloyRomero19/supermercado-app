import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Registra el service worker y, cuando hay una versión nueva de la app descargada, lo avisa con
 * un toast que no se cierra solo. La nueva versión no se activa sola: así no se recarga la página
 * mientras alguien está marcando productos en el súper.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!needRefresh) return
    toast('Hay una versión nueva de la app', {
      id: 'update',
      duration: Infinity,
      action: { label: 'Actualizar', onClick: () => updateServiceWorker(true) },
      onDismiss: () => setNeedRefresh(false),
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  return null
}
