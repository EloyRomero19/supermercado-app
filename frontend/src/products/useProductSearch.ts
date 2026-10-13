import { useEffect, useState } from 'react'
import { searchProducts } from '../api/products'
import type { Product } from '../api/types'

const DEBOUNCE_MS = 250
const LIMIT = 10

type SearchResult = { query: string; products: Product[]; error: string | null }

export type ProductSearchState =
  | { status: 'idle'; products: Product[] }
  | { status: 'loading'; products: Product[] }
  | { status: 'done'; products: Product[] }
  | { status: 'error'; products: Product[]; error: string }

/**
 * Busca mientras el usuario escribe, con dos cuidados:
 * - Debounce: espera 250 ms sin teclear antes de pedir nada (no una petición por letra).
 * - Cancelación: si llega texto nuevo, aborta la petición anterior. Sin esto, una respuesta
 *   lenta de "le" podría llegar después de la de "leche" y pisar los resultados buenos.
 */
export function useProductSearch(query: string): ProductSearchState {
  const q = query.trim()
  const [result, setResult] = useState<SearchResult | null>(null)

  useEffect(() => {
    if (!q) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchProducts(q, LIMIT, controller.signal)
        .then((products) => setResult({ query: q, products, error: null }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return
          const message = error instanceof Error ? error.message : 'Error al buscar'
          setResult({ query: q, products: [], error: message })
        })
    }, DEBOUNCE_MS)

    // React ejecuta esta limpieza antes del siguiente efecto (o al desmontar)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [q])

  // El estado se deriva: si el resultado guardado no es del texto actual, estamos buscando.
  // Mientras tanto se siguen mostrando los resultados anteriores para que la lista no parpadee.
  if (!q) return { status: 'idle', products: [] }
  if (result?.query !== q) return { status: 'loading', products: result?.products ?? [] }
  if (result.error) return { status: 'error', products: [], error: result.error }
  return { status: 'done', products: result.products }
}
