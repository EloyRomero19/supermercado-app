export function LoadingScreen({ message = 'Cargando…' }: { message?: string }) {
  return (
    <main className="center-screen" aria-busy="true">
      <p className="muted">{message}</p>
    </main>
  )
}
