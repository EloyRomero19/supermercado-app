import { useId, useState } from 'react'
import type { Product } from '../api/types'
import { useProductSearch } from '../products/useProductSearch'

type Props = {
  /** Si se indica, cada resultado es un botón (en la Fase 7: añadir a la lista). */
  onSelect?: (product: Product) => void
}

export function ProductSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const search = useProductSearch(query)
  const inputId = useId()

  return (
    <div className="product-search">
      <label htmlFor={inputId} className="visually-hidden">
        Buscar productos
      </label>
      <input
        id={inputId}
        className="search-input"
        type="search"
        placeholder="Buscar productos: leche, tomate…"
        autoComplete="off"
        maxLength={50}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* aria-live: los lectores de pantalla anuncian los cambios de este texto */}
      <p className="search-status muted" aria-live="polite">
        {search.status === 'loading' && 'Buscando…'}
        {search.status === 'error' && search.error}
        {search.status === 'done' && search.products.length === 0 && `Sin resultados para «${query.trim()}»`}
      </p>

      {search.products.length > 0 && (
        <ul className="search-results">
          {search.products.map((product) => (
            <li key={product.id}>
              {onSelect ? (
                <button type="button" className="search-result" onClick={() => onSelect(product)}>
                  <ProductLabel product={product} />
                </button>
              ) : (
                <div className="search-result">
                  <ProductLabel product={product} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProductLabel({ product }: { product: Product }) {
  return (
    <>
      <span>{product.name}</span>
      <span className="category-tag">{product.categoryName}</span>
    </>
  )
}
