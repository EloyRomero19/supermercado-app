import { Plus, Search, X } from 'lucide-react'
import { useId, useState } from 'react'
import type { Item, Product } from '@/api/types'
import { ProductTile } from '@/components/ProductTile'
import { Skeleton } from '@/components/ui/skeleton'
import { normalize } from '@/products/drawings'
import { useProductSearch } from '@/products/useProductSearch'

type Props = {
  /** El producto del catálogo pendiente en la lista, si lo está */
  pendingOf: (productId: number) => Item | undefined
  /** El producto escrito a mano con ese nombre pendiente en la lista, si lo está */
  pendingCustom: (name: string) => Item | undefined
  onAdd: (product: Product) => void
  onTake: (item: Item) => void
  /** Añadir lo escrito tal cual, aunque no esté en el catálogo */
  onAddCustom: (name: string) => void
}

/**
 * Buscador fijo abajo, a mano del pulgar (encima de la barra de pestañas). Al escribir, los
 * resultados suben en fichas como las de la lista: teja si ya está (un toque lo quita), azul si no
 * (un toque lo añade). Solo salen los productos cuyo nombre empieza por lo escrito; lo escrito tal
 * cual es UNA FICHA MÁS al final (con su dibujo, adivinado por las palabras), que no sale si
 * coincide exactamente con un producto. Si nada empieza así, solo se ve esa ficha.
 * Tras elegir, el campo se vacía.
 */
export function ProductSearch({ pendingOf, pendingCustom, onAdd, onTake, onAddCustom }: Props) {
  const [query, setQuery] = useState('')
  const search = useProductSearch(query)
  const inputId = useId()
  const resultsId = useId()
  const text = query.trim()
  const open = text.length > 0

  // Comparar sin mayúsculas ni tildes: "platano" encuentra "Plátano"
  const wanted = normalize(text)
  const ready = search.status === 'done' || search.status === 'error'
  // Solo lo que EMPIEZA por lo escrito ("leche" → "Leche entera"), y el singular de un plural
  // ("tomates" → "Tomate"). Lo que solo lo contiene en medio ("avena" → "Bebida de avena"), lo
  // que es más corto ("turrón de jijona" → "Turrón") o lo que se le parece (la búsqueda por
  // similitud del backend) no se enseña: despista. Si no queda nada, solo se ve la ficha de
  // apuntarlo tal cual.
  const isSameName = (name: string) => wanted === name || wanted === `${name}s` || wanted === `${name}es`
  // Para "empieza por", la ñ es una letra propia: si no, "pan" enseñaría "Pañales"
  const strictWanted = withEnye(text)
  const shown = search.products.filter((product) => {
    return wanted.length > 0 && (withEnye(product.name).startsWith(strictWanted) || isSameName(normalize(product.name)))
  })
  // Exacto también en plural: con "tomates" ya está "Tomate", apuntarlo aparte sería repetirlo
  const exact = shown.find((product) => isSameName(normalize(product.name)))
  const showCustom = ready && wanted.length > 0 && !exact

  const done = () => setQuery('')
  const pick = (product: Product) => {
    const pending = pendingOf(product.id)
    if (pending) onTake(pending)
    else onAdd(product)
    done()
  }
  const pickCustom = () => {
    const pending = pendingCustom(text)
    if (pending) onTake(pending)
    else onAddCustom(text)
    done()
  }
  // Enter o "+": lo que coincide exactamente; si no, la primera ficha que se ve
  const submit = () => {
    if (!text || search.status === 'loading') return
    if (exact) {
      if (!pendingOf(exact.id)) onAdd(exact)
      done()
    } else if (shown.length === 0) {
      if (!pendingCustom(text)) onAddCustom(text)
      done()
    } else {
      if (!pendingOf(shown[0].id)) onAdd(shown[0])
      done()
    }
  }

  const pendingText = showCustom ? pendingCustom(text) : undefined
  const customTile = showCustom && (
    <ProductTile
      key="custom"
      tone={pendingText ? 'need' : 'stock'}
      // Si ya está apuntado, con el nombre guardado (no como se ha tecleado ahora)
      name={pendingText?.name ?? text}
      categoryName={pendingText?.categoryName ?? null}
      note={pendingText ? null : 'Apuntar tal cual'}
      quantity={pendingText?.quantity}
      label={pendingText ? `${pendingText.name} ya está en la lista. Toca para quitarlo` : `Apuntar «${text}» tal cual, aunque no esté en el catálogo`}
      onClick={pickCustom}
    />
  )

  return (
    <>
      {/* Velo detrás de los resultados: tocar fuera los cierra */}
      {open && <button type="button" tabIndex={-1} aria-hidden="true" className="fixed inset-0 z-30 bg-overlay/60" onClick={done} />}

      {/* view-transition-name: mientras las fichas viajan (lib/viewTransition.ts) se pintan en una capa
          aparte; con nombre propio, el buscador sigue quedando por encima de ellas */}
      <div className="bottom-above-tabbar fixed inset-x-0 z-30 lg:left-(--rail-width)" style={{ viewTransitionName: 'search-bar' }}>
        <div className="mx-auto w-full max-w-4xl rounded-t-2xl border-t bg-card shadow-float lg:mx-8 lg:w-auto xl:mx-auto">
          {open && (
            <div id={resultsId} className="max-h-[min(30rem,55dvh)] overflow-y-auto overscroll-contain px-4 pt-4 pb-1">
              {search.status === 'error' && <p className="pb-3 text-sm text-destructive">{search.error}</p>}

              {search.status === 'loading' && shown.length === 0 ? (
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : (
                <>
                  {showCustom && shown.length === 0 && <p className="pb-2 text-sm text-muted-foreground">No está en el catálogo: se apunta tal cual.</p>}
                  <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
                    {shown.map((product) => {
                      const pending = pendingOf(product.id)
                      return (
                        <ProductTile
                          key={product.id}
                          tone={pending ? 'need' : 'stock'}
                          name={product.name}
                          categoryName={product.categoryName}
                          quantity={pending?.quantity}
                          label={pending ? `${product.name} ya está en la lista. Toca para quitarlo` : `Añadir ${product.name} a la lista`}
                          onClick={() => pick(product)}
                        />
                      )
                    })}
                    {customTile}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* aria-live: los lectores de pantalla anuncian el resultado de la búsqueda */}
          <p className="sr-only" aria-live="polite">
            {search.status === 'loading' && 'Buscando…'}
            {search.status === 'done' && (shown.length > 0 ? `${shown.length} en el catálogo` : 'No está en el catálogo')}
          </p>

          <form
            className="flex items-center gap-2.5 px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <div className="relative min-w-0 flex-1">
              <label htmlFor={inputId} className="sr-only">
                ¿Qué falta?
              </label>
              <Search className="chalk pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id={inputId}
                type="search"
                placeholder="¿Qué falta?"
                autoComplete="off"
                enterKeyHint="done"
                maxLength={120}
                value={query}
                aria-controls={open ? resultsId : undefined}
                aria-expanded={open}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && done()}
                className="h-12 w-full rounded-full border-2 border-input bg-background pr-11 pl-12 text-base transition-colors duration-150 outline-none placeholder:text-muted-foreground focus-visible:border-title [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Borrar la búsqueda"
                  onClick={done}
                  className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!text}
              aria-label={text ? `Añadir «${text}»` : 'Añadir (escribe primero qué falta)'}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground outline-none transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-40"
            >
              <Plus className="size-6" strokeWidth={2.75} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

/** Como normalize (sin mayúsculas ni tildes) pero conservando la ñ: "Pañales" → "pañales", no "panales". */
function withEnye(text: string): string {
  return normalize(text.toLowerCase().replaceAll('ñ', 'nyy')).replaceAll('nyy', 'ñ')
}
