/**
 * Recuerda en este navegador la última lista abierta, para la pestaña "Comprar".
 * Es solo una comodidad: si el almacenamiento no está disponible (modo privado, bloqueado…)
 * se ignora sin romper nada.
 */
const KEY = 'last-list-id'

export function rememberLastList(listId: string) {
  try {
    localStorage.setItem(KEY, listId)
  } catch {
    // sin almacenamiento: la pestaña "Comprar" llevará a "Mis listas"
  }
}

export function lastListId(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function forgetLastList() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nada que borrar
  }
}
