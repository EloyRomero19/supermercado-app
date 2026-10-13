import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Registra el service worker y, cuando hay una versión nueva de la app descargada, lo avisa.
 * La nueva versión no se activa sola: así no se recarga la página mientras alguien está
 * marcando productos en el súper.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null
  return (
    <div className="toast" role="status">
      <span>Hay una versión nueva de la app.</span>
      <button type="button" className="link-button" onClick={() => updateServiceWorker(true)}>
        Actualizar
      </button>
      <button type="button" className="link-button" onClick={() => setNeedRefresh(false)}>
        Ahora no
      </button>
    </div>
  )
}
