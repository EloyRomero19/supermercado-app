import { useSyncExternalStore } from 'react'

/** Lo que elige el usuario: seguir al sistema, o fijar claro u oscuro. */
export type ThemePreference = 'system' | 'light' | 'dark'
/** Lo que se ve de verdad. */
export type Theme = 'light' | 'dark'

// Misma clave que public/theme-init.js, que aplica el tema antes de pintar la página
const KEY = 'theme'
// Color de la barra del navegador / del sistema (igual que el fondo de la app en cada tema)
const BAR_COLOR: Record<Theme, string> = { light: '#f8fbf8', dark: '#0c110d' }

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system' // sin almacenamiento (modo privado…): como el sistema
  }
}

let preference = readPreference()

function resolve(pref: ThemePreference): Theme {
  return pref === 'system' ? (systemDark().matches ? 'dark' : 'light') : pref
}

/** Pone el tema en <html data-theme> (de ahí cuelgan los colores de index.css) y avisa a React. */
function apply() {
  const theme = resolve(preference)
  document.documentElement.dataset.theme = theme
  // Las <meta theme-color> de index.html eligen color según el sistema; si el usuario fija un
  // tema, la barra del navegador debe ir con él
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute('content', BAR_COLOR[theme]))
  listeners.forEach((listener) => listener())
}

export function setThemePreference(pref: ThemePreference) {
  preference = pref
  try {
    if (pref === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch {
    // sin almacenamiento: vale para esta visita
  }
  apply()
}

/** Se llama una vez al arrancar: aplica el tema y, en "Automático", sigue los cambios del sistema. */
export function initTheme() {
  apply()
  systemDark().addEventListener('change', () => {
    if (preference === 'system') apply()
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Tema actual para los componentes; se vuelven a pintar al cambiarlo. */
export function useTheme() {
  const pref = useSyncExternalStore(subscribe, () => preference)
  const theme = useSyncExternalStore(subscribe, () => resolve(preference))
  return { preference: pref, theme, setPreference: setThemePreference }
}
