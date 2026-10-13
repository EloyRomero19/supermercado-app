export function inviteUrl(code: string): string {
  return `${window.location.origin}/unirse/${code}`
}

/**
 * En el móvil abre el menú nativo de compartir (WhatsApp, Telegram…) con la Web Share API;
 * donde no existe (la mayoría de navegadores de escritorio), copia el enlace al portapapeles.
 */
export async function shareInvite(code: string, listName: string): Promise<'shared' | 'copied' | 'cancelled'> {
  const url = inviteUrl(code)
  if (navigator.share) {
    try {
      await navigator.share({ title: listName, text: `Únete a mi lista de la compra «${listName}»`, url })
      return 'shared'
    } catch (error) {
      // El usuario cerró el menú de compartir: no es un error
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      throw error
    }
  }
  await navigator.clipboard.writeText(url)
  return 'copied'
}

/**
 * Saca el código de lo que pegue el usuario: el enlace completo
 * ("https://…/unirse/K7MX4QPA", venga del dominio que venga) o solo el código ("K7MX4QPA").
 * Devuelve null si no parece ninguna de las dos cosas.
 */
export function extractInviteCode(input: string): string | null {
  const text = input.trim()
  const fromUrl = text.match(/\/unirse\/([A-Za-z0-9-]+)\/?(?:[?#].*)?$/)
  if (fromUrl) return fromUrl[1]
  // Un código suelto (el backend ya ignora mayúsculas, espacios y guiones)
  if (/^[A-Za-z0-9][A-Za-z0-9\s-]{3,18}[A-Za-z0-9]$/.test(text)) return text
  return null
}
