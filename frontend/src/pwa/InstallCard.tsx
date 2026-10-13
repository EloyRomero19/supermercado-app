import { needsIosInstallHint, useInstallPrompt } from './installPrompt'

export function InstallCard() {
  const install = useInstallPrompt()

  if (install) {
    return (
      <section className="card install-card">
        <div>
          <h2>Instala la app</h2>
          <p className="muted">Ábrela desde la pantalla de inicio, como cualquier otra app.</p>
        </div>
        <button type="button" className="button" onClick={install}>
          Instalar
        </button>
      </section>
    )
  }
  if (needsIosInstallHint()) {
    return (
      <section className="card">
        <h2>Instala la app</h2>
        <p className="muted">
          En Safari, pulsa el botón Compartir y luego «Añadir a pantalla de inicio».
        </p>
      </section>
    )
  }
  return null
}
