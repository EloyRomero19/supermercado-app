import { PencilLine, Plus, Search, X } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import type { Product } from '@/api/types'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useProductSearch } from '@/products/useProductSearch'
import { ProductIcon } from './ProductIcon'

type Props = {
  /** Si se indica, cada resultado es un botón que llama a esta función. */
  onSelect?: (product: Product) => void
  /** Si se indica, se ofrece añadir lo escrito tal cual, aunque no esté en el catálogo. */
  onAddCustom?: (name: string) => void
  className?: string
}

/** Campo de búsqueda con autocompletado: resultados del catálogo con su icono y un "+" para añadir. */
export function ProductSearch({ onSelect, onAddCustom, className }: Props) {
  const [query, setQuery] = useState('')
  const search = useProductSearch(query)
  const inputId = useId()
  const text = query.trim()

  const select = (product: Product) => {
    onSelect?.(product)
    setQuery('')
  }

  const addCustom = () => {
    onAddCustom?.(text)
    setQuery('')
  }

  const showResults = search.products.length > 0 || (onAddCustom && text)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={inputId} className="sr-only">
        Buscar productos
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id={inputId}
          type="search"
          placeholder="¿Qué necesitas? Leche, tomates…"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={onAddCustom ? 120 : 50}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Enter sin elegir nada: añade el primer resultado, o el texto libre si no hay ninguno
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || !text) return
            e.preventDefault()
            if (onSelect && search.status === 'done' && search.products.length > 0) select(search.products[0])
            else if (onAddCustom && search.status !== 'loading') addCustom()
          }}
          className="h-13 w-full rounded-xl border border-input bg-muted/60 pr-12 pl-11 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Borrar la búsqueda"
            onClick={() => setQuery('')}
            className="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* aria-live: los lectores de pantalla anuncian el resultado de la búsqueda */}
      <p className="sr-only" aria-live="polite">
        {search.status === 'loading' && 'Buscando…'}
        {search.status === 'done' && `${search.products.length} resultados`}
      </p>
      {search.status === 'error' && <p className="px-1 text-sm text-destructive">{search.error}</p>}
      {search.status === 'done' && search.products.length === 0 && (
        <p className="px-1 text-sm text-muted-foreground">«{text}» no está en el catálogo.</p>
      )}

      {search.status === 'loading' && search.products.length === 0 && (
        <div className="flex flex-col gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      )}

      {showResults && (
        <ul className="flex flex-col">
          {search.products.map((product) => {
            return (
              <li key={product.id}>
                {onSelect ? (
                  <ResultButton onClick={() => select(product)} label={`Añadir ${product.name}`}>
                    <ProductIcon icon={product.icon} categoryName={product.categoryName} size="sm" />
                    <ResultText name={product.name} detail={product.categoryName} />
                  </ResultButton>
                ) : (
                  <div className="flex min-h-13 items-center gap-3 px-2">
                    <ProductIcon icon={product.icon} categoryName={product.categoryName} size="sm" />
                    <ResultText name={product.name} detail={product.categoryName} />
                  </div>
                )}
              </li>
            )
          })}
          {onAddCustom && text && search.status !== 'loading' && (
            <li>
              <ResultButton onClick={addCustom} label={`Añadir «${text}» como texto libre`}>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                  <PencilLine className="size-4" aria-hidden="true" />
                </span>
                <ResultText name={`Añadir «${text}»`} detail="Escrito a mano, sin sección" accent />
              </ResultButton>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function ResultButton({ children, onClick, label }: { children: ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group flex min-h-13 w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.99] motion-safe:transition-transform"
    >
      {children}
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
        aria-hidden="true"
      >
        <Plus className="size-5" />
      </span>
    </button>
  )
}

function ResultText({ name, detail, accent = false }: { name: string; detail: string; accent?: boolean }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className={cn('truncate font-medium', accent && 'text-primary')}>{name}</span>
      <span className="truncate text-xs text-muted-foreground">{detail}</span>
    </span>
  )
}
