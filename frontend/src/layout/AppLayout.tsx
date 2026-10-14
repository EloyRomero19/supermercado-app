import { Outlet } from 'react-router'
import { TabBar } from './TabBar'

/**
 * Páginas con sesión iniciada: contenido centrado con un ancho máximo cómodo (en el móvil ocupa
 * todo el ancho) y la barra inferior. pb-tabbar reserva el hueco de la barra al final.
 */
export function AppLayout() {
  return (
    <>
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col pb-tabbar">
        <Outlet />
      </div>
      <TabBar />
    </>
  )
}
