import { useSyncExternalStore } from 'react'

/** Evento propio de Chrome/Edge/Android (no está en los tipos estándar del DOM). */
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> }

/**
 * El navegador lanza "beforeinstallprompt" una sola vez, nada más cargar, cuando la app se puede
 * instalar. Lo capturamos aquí, a nivel de módulo (importado desde main.tsx), porque a esas
 * alturas puede que el componente que muestra el botón aún no exista.
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault() // no mostrar el aviso automático: usaremos nuestro botón
  deferredPrompt = event as BeforeInstallPromptEvent
  notify()
})
window.addEventListener('appinstalled', () => {
  deferredPrompt = null
  notify()
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Devuelve una función para instalar la app, o null si el navegador no lo ofrece. */
export function useInstallPrompt(): (() => Promise<void>) | null {
  const prompt = useSyncExternalStore(subscribe, () => deferredPrompt)
  if (!prompt) return null
  return async () => {
    await prompt.prompt()
    deferredPrompt = null // el evento solo se puede usar una vez
    notify()
  }
}

/** iPhone/iPad en Safari: no hay botón de instalar, hay que hacerlo desde "Compartir". */
export function needsIosInstallHint(): boolean {
  const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return isIos && !isInstalled
}
