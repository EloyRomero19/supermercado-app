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
