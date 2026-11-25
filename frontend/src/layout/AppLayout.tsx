import { Outlet } from 'react-router'
import { TabBar } from './TabBar'

/**
 * Páginas con sesión iniciada. En el móvil ocupan todo el ancho, con la barra inferior; en
 * escritorio dejan sitio al menú lateral. Cada página decide su ancho máximo.
 * pb-tabbar reserva el hueco de la barra inferior al final.
 */
export function AppLayout() {
  return (
    <>
      <div className="flex min-h-dvh w-full flex-col pb-tabbar lg:pl-(--rail-width)">
        <Outlet />
      </div>
      <TabBar />
    </>
  )
}
