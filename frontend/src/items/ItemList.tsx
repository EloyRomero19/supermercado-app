import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Item } from '../api/types'
import { ProductIcon } from '../components/ProductIcon'
import { categoryStyle, OTHER_CATEGORY } from './categoryStyle'
import { groupByCategory } from './sortItems'

type Props = {
  items: Item[]
  onToggle: (item: Item) => void
  onQuantity: (item: Item, quantity: number) => void
  onNote: (item: Item) => void
  onDelete: (item: Item) => void
  onClearChecked: () => void
}

export function ItemList({ items, onToggle, onQuantity, onNote, onDelete, onClearChecked }: Props) {
  const pending = items.filter((item) => !item.checked)
  const inCart = items.filter((item) => item.checked)
  const rowProps = { onToggle, onQuantity, onNote, onDelete }

  if (items.length === 0) {
    return (
      <section className="card empty-state">
        <span className="empty-emoji" aria-hidden="true">
          🛒
        </span>
        <h2>Tu lista está vacía</h2>
        <p className="muted">Busca arriba lo que necesitas: aparecerá aquí, ordenado por secciones del súper.</p>
      </section>
    )
  }

  return (
    <>
      {pending.length === 0 ? (
        <section className="card empty-state">
          <span className="empty-emoji" aria-hidden="true">
            🎉
          </span>
          <h2>¡Todo en el carro!</h2>
          <p className="muted">Ya tienes todo lo de la lista.</p>
        </section>
      ) : (
        groupByCategory(pending).map((group) => {
          const style = categoryStyle(group.category === OTHER_CATEGORY ? null : group.category)
          return (
            <section key={group.category} className="item-group" style={{ '--tone': style.color } as CSSProperties}>
              <h2 className="group-title">
                <span aria-hidden="true">{style.icon}</span>
                {group.category}
                <span className="group-count">{group.items.length}</span>
              </h2>
              <ul className="items">
                {group.items.map((item) => (
                  <ItemRow key={item.id} item={item} {...rowProps} />
                ))}
              </ul>
            </section>
          )
        })
      )}

      {inCart.length > 0 && (
        <section className="item-group item-group-cart">
          <div className="group-header">
            <h2 className="group-title">
              <span aria-hidden="true">🛒</span>
              En el carro
              <span className="group-count">{inCart.length}</span>
            </h2>
            <button type="button" className="chip-button" onClick={onClearChecked}>
              Vaciar el carro
            </button>
          </div>
          <ul className="items">
            {inCart.map((item) => (
              <ItemRow key={item.id} item={item} {...rowProps} />
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

type RowProps = Omit<Props, 'items' | 'onClearChecked'> & { item: Item }

function ItemRow({ item, onToggle, onQuantity, onNote, onDelete }: RowProps) {
  return (
    <li className={item.checked ? 'item item-checked' : 'item'}>
      {/* Toda la fila (icono y nombre incluidos) marca el producto: fácil de acertar con el dedo */}
      <label className="item-main">
        <input type="checkbox" className="check" checked={item.checked} onChange={() => onToggle(item)} />
        <ProductIcon icon={item.icon} categoryName={item.categoryName} />
        <span className="item-text">
          <span className="item-name">
            {item.name}
            {item.quantity > 1 && <span className="quantity-badge"> ×{item.quantity}</span>}
          </span>
          {item.note && <span className="item-note">{item.note}</span>}
          {item.checked && item.checkedByName && <span className="item-note">✓ {item.checkedByName}</span>}
        </span>
      </label>

      <ItemMenu item={item} onQuantity={onQuantity} onNote={onNote} onDelete={onDelete} />
    </li>
  )
}

/**
 * Menú "⋯" con las acciones menos frecuentes (cantidad, nota, quitar). Fuera de la fila, para
 * que el nombre del producto tenga todo el ancho en pantallas pequeñas.
 */
function ItemMenu({ item, onQuantity, onNote, onDelete }: Pick<RowProps, 'item' | 'onQuantity' | 'onNote' | 'onDelete'>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al pulsar fuera del menú
  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const choose = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  return (
    <div className="item-menu" ref={ref}>
      <button
        type="button"
        className="icon-button"
        aria-label={`Más opciones de ${item.name}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ⋯
      </button>
      {open && (
        <div className="menu" role="menu">
          {!item.checked && (
            // El selector de cantidad no cierra el menú: se puede pulsar "+" varias veces seguidas
            <div className="menu-stepper">
              <span>Cantidad</span>
              <div className="stepper" role="group" aria-label={`Cantidad de ${item.name}`}>
                <button
                  type="button"
                  aria-label={`Quitar uno de ${item.name}`}
                  disabled={item.quantity <= 1}
                  onClick={() => onQuantity(item, item.quantity - 1)}
                >
                  −
                </button>
                <span aria-live="polite">{item.quantity}</span>
                <button
                  type="button"
                  aria-label={`Añadir uno más de ${item.name}`}
                  onClick={() => onQuantity(item, item.quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
          )}
          {!item.checked && (
            <button type="button" role="menuitem" onClick={choose(() => onNote(item))}>
              ✎ {item.note ? 'Editar nota' : 'Añadir nota'}
            </button>
          )}
          <button type="button" role="menuitem" className="danger" onClick={choose(() => onDelete(item))}>
            🗑 Quitar de la lista
          </button>
        </div>
      )}
    </div>
  )
}
