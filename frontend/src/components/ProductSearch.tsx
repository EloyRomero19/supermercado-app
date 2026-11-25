import { PencilLine, Search, X } from 'lucide-react'
import { useId, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ProductRow, type CatalogActions } from '@/products/ProductRow'
import { useProductSearch } from '@/products/useProductSearch'

type Props = {
  catalog: CatalogActions
  /** Añadir lo escrito tal cual, aunque no esté en el catálogo. */
  onAddCustom: (name: string) => void
  className?: string
}

/**
 * Buscador de productos. Los resultados salen en un panel bajo el campo, por encima de la página
 * (como las sugerencias de una tienda online), cada uno con su botón Añadir / − 1 +. El panel sigue
 * abierto tras añadir, para poder subir la cantidad; se cierra borrando la búsqueda o con Escape.
 */
export function ProductSearch({ catalog, onAddCustom, className }: Props) {
  const [query, setQuery] = useState('')
  const search = useProductSearch(query)
  const inputId = useId()
  const resultsId = useId()
  const text = query.trim()
  const open = text.length > 0

  const addCustom = () => {
    onAddCustom(text)
    setQuery('')
  }

  return (
    <div className={cn('relative', className)}>
      <label htmlFor={inputId} className="sr-only">
        Buscar productos
      </label>
      <Search className="chalk pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        id={inputId}
        type="search"
        placeholder="Apunta lo que falta: leche, pan…"
        autoComplete="off"
        enterKeyHint="done"
        maxLength={120}
        value={query}
        aria-controls={open ? resultsId : undefined}
        aria-expanded={open}
        onChange={(e) => setQuery(e.target.value)}
        // Enter sin elegir nada: añade el primer resultado, o el texto libre si no hay ninguno
        onKeyDown={(e) => {
          if (e.key === 'Escape') return setQuery('')
          if (e.key !== 'Enter' || !text) return
          e.preventDefault()
          if (search.status === 'done' && search.products.length > 0) {
            catalog.add(search.products[0])
            setQuery('')
          } else if (search.status !== 'loading') addCustom()
        }}
        className="h-12 w-full rounded-xl border-2 border-input bg-foreground/5 pr-12 pl-12 text-base transition-colors duration-150 outline-none placeholder:text-muted-foreground focus-visible:border-title [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button
          type="button"
          aria-label="Borrar la búsqueda"
          onClick={() => setQuery('')}
          className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}

      {/* aria-live: los lectores de pantalla anuncian el resultado de la búsqueda */}
      <p className="sr-only" aria-live="polite">
        {search.status === 'loading' && 'Buscando…'}
        {search.status === 'done' && `${search.products.length} resultados`}
      </p>

      {open && (
        <div
          id={resultsId}
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-[min(30rem,60dvh)] origin-top animate-in fade-in-0 zoom-in-[0.98] overflow-y-auto overscroll-contain rounded-xl border bg-popover px-4 shadow-float duration-150"
        >
          {search.status === 'error' && <p className="py-3 text-sm text-destructive">{search.error}</p>}

          {search.status === 'loading' && search.products.length === 0 && (
            <div className="flex flex-col divide-y" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex h-[4.5rem] items-center gap-3">
                  <Skeleton className="size-14 rounded-lg" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-11 w-[7.5rem] rounded-full" />
                </div>
              ))}
            </div>
          )}

          {search.status === 'done' && search.products.length === 0 && (
            <p className="pt-3 text-sm text-muted-foreground">«{text}» no está en el catálogo, pero puedes añadirlo tal cual.</p>
          )}

          {search.products.length > 0 && (
            <ul className="flex flex-col divide-y">
              {search.products.map((product) => (
                <ProductRow key={product.id} product={product} catalog={catalog} />
              ))}
            </ul>
          )}

          {search.status !== 'loading' && (
            <button
              type="button"
              onClick={addCustom}
              className="-mx-4 flex min-h-14 w-[calc(100%+2rem)] items-center gap-3 border-t px-4 text-left outline-none transition-colors duration-150 hover:bg-muted focus-visible:bg-muted"
            >
              <PencilLine className="chalk size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">
                Añadir «<span className="font-semibold">{text}</span>» tal cual
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
