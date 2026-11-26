import { PencilLine, Plus, Search, X } from 'lucide-react'
import { useId, useState } from 'react'
import type { Item, Product } from '@/api/types'
import { ProductTile } from '@/components/ProductTile'
import { Skeleton } from '@/components/ui/skeleton'
import { useProductSearch } from '@/products/useProductSearch'

type Props = {
  /** El producto pendiente en la lista, si lo está */
  pendingOf: (productId: number) => Item | undefined
  onAdd: (product: Product) => void
  onTake: (item: Item) => void
  /** Añadir lo escrito tal cual, aunque no esté en el catálogo */
  onAddCustom: (name: string) => void
}

/**
 * Buscador fijo abajo, a mano del pulgar (encima de la barra de pestañas). Al escribir, los
 * resultados suben en fichas como las de la lista: teja si ya está (un toque lo quita), azul si no
 * (un toque lo añade). Tras elegir, el campo se vacía para apuntar lo siguiente.
 */
export function ProductSearch({ pendingOf, onAdd, onTake, onAddCustom }: Props) {
  const [query, setQuery] = useState('')
  const search = useProductSearch(query)
  const inputId = useId()
  const resultsId = useId()
  const text = query.trim()
  const open = text.length > 0

  const done = () => setQuery('')
  const addCustom = () => {
    if (!text) return
    onAddCustom(text)
    done()
  }
  // Enter o "+": el primer resultado si lo hay; si no, lo escrito tal cual
  const submit = () => {
    if (!text) return
    if (search.status === 'done' && search.products.length > 0) {
      const first = search.products[0]
      const pending = pendingOf(first.id)
      if (!pending) onAdd(first)
      done()
    } else if (search.status !== 'loading') addCustom()
  }

  return (
    <>
      {/* Velo detrás de los resultados: tocar fuera los cierra */}
      {open && <button type="button" tabIndex={-1} aria-hidden="true" className="fixed inset-0 z-30 bg-overlay/60" onClick={done} />}

      {/* view-transition-name: mientras las fichas viajan (lib/viewTransition.ts) se pintan en una capa
          aparte; con nombre propio, el buscador sigue quedando por encima de ellas */}
      <div className="bottom-above-tabbar fixed inset-x-0 z-30 lg:left-(--rail-width)" style={{ viewTransitionName: 'search-bar' }}>
        <div className="mx-auto w-full max-w-4xl rounded-t-2xl border-t bg-card shadow-float lg:mx-8 lg:w-auto xl:mx-auto">
          {open && (
            <div id={resultsId} className="max-h-[min(30rem,55dvh)] overflow-y-auto overscroll-contain px-4 pt-4">
              {search.status === 'error' && <p className="pb-3 text-sm text-destructive">{search.error}</p>}

              {search.status === 'loading' && search.products.length === 0 && (
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              )}

              {search.status === 'done' && search.products.length === 0 && (
                <p className="pb-1 text-sm text-muted-foreground">«{text}» no está en el catálogo, pero puedes apuntarlo tal cual.</p>
              )}

              {search.products.length > 0 && (
                <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
                  {search.products.map((product) => {
                    const pending = pendingOf(product.id)
                    return (
                      <ProductTile
                        key={product.id}
                        tone={pending ? 'need' : 'stock'}
                        name={product.name}
                        categoryName={product.categoryName}
                        quantity={pending?.quantity}
                        label={pending ? `${product.name} ya está en la lista. Toca para quitarlo` : `Añadir ${product.name} a la lista`}
                        onClick={() => {
                          if (pending) onTake(pending)
                          else onAdd(product)
                          done()
                        }}
                      />
                    )
                  })}
                </ul>
              )}

              {search.status !== 'loading' && (
                <button
                  type="button"
                  onClick={addCustom}
                  className="-mx-4 mt-2 flex min-h-13 w-[calc(100%+2rem)] items-center gap-3 border-t px-4 text-left outline-none transition-colors duration-150 hover:bg-muted focus-visible:bg-muted"
                >
                  <PencilLine className="chalk size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">
                    Apuntar «<span className="font-semibold">{text}</span>» tal cual
                  </span>
                </button>
              )}
            </div>
          )}

          {/* aria-live: los lectores de pantalla anuncian el resultado de la búsqueda */}
          <p className="sr-only" aria-live="polite">
            {search.status === 'loading' && 'Buscando…'}
            {search.status === 'done' && `${search.products.length} resultados`}
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
