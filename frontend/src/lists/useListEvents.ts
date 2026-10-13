import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import { useEffect, useEffectEvent, useState } from 'react'
import { ApiError, authFetch } from '../api/client'

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting'

type Handlers = {
  onEvent: (type: string, data: unknown) => void
  /** Se reabrió la conexión: pudimos perder eventos mientras tanto, hay que recargar. */
  onReconnected: () => void
  /** La lista ya no existe o ya no somos miembros (404 al conectar). */
  onGone: () => void
}

/** Error que NO debe reintentarse (en fetchEventSource, lanzar desde onerror detiene los reintentos). */
class FatalStreamError extends Error {}

/**
 * Se suscribe a los eventos en tiempo real de una lista (GET /api/lists/{id}/events).
 * Usamos fetchEventSource en lugar del EventSource del navegador porque este no permite enviar
 * la cabecera Authorization. Además, cierra la conexión cuando la pestaña queda oculta (ahorra
 * batería en el móvil) y la reabre al volver.
 */
export function useListEvents(listId: string, enabled: boolean, handlers: Handlers): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  // useEffectEvent: funciones que siempre ven las props/estado más recientes, pero que no son
  // dependencias del efecto. Sin esto, cada render cerraría y reabriría la conexión.
  const onEvent = useEffectEvent((type: string, data: unknown) => handlers.onEvent(type, data))
  const onReconnected = useEffectEvent(() => handlers.onReconnected())
  const onGone = useEffectEvent(() => handlers.onGone())

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    let openedBefore = false
    let retryDelay = 1000

    fetchEventSource(`/api/lists/${listId}/events`, {
      signal: controller.signal,
      // Nuestro fetch: añade el token y, si ha caducado (401), lo renueva y reintenta
      fetch: (input, init) => authFetch(String(input), init),

      async onopen(response) {
        const isStream = response.headers.get('content-type')?.startsWith(EventStreamContentType)
        if (response.ok && isStream) {
          setStatus('live')
          retryDelay = 1000
          if (openedBefore) onReconnected()
          openedBefore = true
          return
        }
        if (response.status === 404 || response.status === 403) throw new FatalStreamError('gone')
        throw new Error(`HTTP ${response.status}`) // otro error (500, 502…): reintentar
      },

      onmessage(message) {
        if (!message.event || message.event === 'ready') return
        onEvent(message.event, message.data ? JSON.parse(message.data) : null)
      },

      // El servidor cerró la conexión (cada 15 min, o al expulsarnos): lanzar = reintentar
      onclose() {
        throw new Error('closed')
      },

      onerror(error) {
        if (error instanceof FatalStreamError || error instanceof ApiError) throw error
        setStatus('reconnecting')
        // Espera creciente entre reintentos (1 s, 2 s, 4 s… hasta 30 s): si el servidor está
        // caído, no lo saturamos con reconexiones de todos los clientes a la vez
        retryDelay = Math.min(retryDelay * 2, 30_000)
        return retryDelay
      },
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      if (error instanceof FatalStreamError) onGone()
      // ApiError 401: la sesión caducó; AuthProvider ya se encarga de mandar al login
    })

    return () => controller.abort()
  }, [listId, enabled])

  return enabled ? status : 'connecting'
}
