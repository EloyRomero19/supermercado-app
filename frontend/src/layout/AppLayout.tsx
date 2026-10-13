import { Outlet } from 'react-router'
import { TabBar } from './TabBar'

/** Páginas con sesión iniciada: el contenido de la ruta y la barra inferior. */
export function AppLayout() {
  return (
    <>
      <Outlet />
      <TabBar />
    </>
  )
}
