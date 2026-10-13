import { useId, useState } from 'react'
import type { Product } from '../api/types'
import { useProductSearch } from '../products/useProductSearch'
import { ProductIcon } from './ProductIcon'

type Props = {
  /** Si se indica, cada resultado es un botón que llama a esta función. */
  onSelect?: (product: Product) => void
  /** Si se indica, se ofrece añadir lo escrito tal cual, aunque no esté en el catálogo. */
  onAddCustom?: (name: string) => void
}

export function ProductSearch({ onSelect, onAddCustom }: Props) {
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

  return (
    <div className="product-search">
      <label htmlFor={inputId} className="visually-hidden">
        Buscar productos
      </label>
      <input
        id={inputId}
        className="search-input"
        type="search"
        placeholder="¿Qué necesitas? Leche, tomates…"
        autoComplete="off"
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
      />

      {/* aria-live: los lectores de pantalla anuncian los cambios de este texto */}
      <p className="search-status muted" aria-live="polite">
        {search.status === 'loading' && 'Buscando…'}
        {search.status === 'error' && search.error}
        {search.status === 'done' && search.products.length === 0 && `«${text}» no está en el catálogo`}
      </p>

      {(search.products.length > 0 || (onAddCustom && text)) && (
        <ul className="search-results">
          {search.products.map((product) => (
            <li key={product.id}>
              {onSelect ? (
                <button type="button" className="search-result" onClick={() => select(product)}>
                  <ProductLabel product={product} />
                </button>
              ) : (
                <div className="search-result">
                  <ProductLabel product={product} />
                </div>
              )}
            </li>
          ))}
          {onAddCustom && text && (
            <li>
              <button type="button" className="search-result search-result-custom" onClick={addCustom}>
                <ProductIcon icon="✏️" categoryName={null} size="sm" />
                <span className="search-result-text">
                  <span className="search-result-name">Añadir «{text}»</span>
                  <span className="search-result-category">Escrito a mano, sin sección</span>
                </span>
                <span className="search-result-add" aria-hidden="true">
                  +
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function ProductLabel({ product }: { product: Product }) {
  return (
    <>
      <ProductIcon icon={product.icon} categoryName={product.categoryName} size="sm" />
      <span className="search-result-text">
        <span className="search-result-name">{product.name}</span>
        <span className="search-result-category">{product.categoryName}</span>
      </span>
      <span className="search-result-add" aria-hidden="true">
        +
      </span>
    </>
  )
}
