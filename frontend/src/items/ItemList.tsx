import type { Item } from '../api/types'
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

  if (items.length === 0) {
    return (
      <section className="card empty">
        <p className="muted">La lista está vacía. Busca arriba lo que necesitas.</p>
      </section>
    )
  }

  return (
    <>
      {pending.length === 0 ? (
        <section className="card empty">
          <p>¡Todo en el carro!</p>
        </section>
      ) : (
        groupByCategory(pending).map((group) => (
          <section key={group.category} className="card item-group">
            <h2 className="item-group-title">{group.category}</h2>
            <ul className="items">
              {group.items.map((item) => (
                <ItemRow key={item.id} item={item} onToggle={onToggle} onQuantity={onQuantity} onNote={onNote} onDelete={onDelete} />
              ))}
            </ul>
          </section>
        ))
      )}

      {inCart.length > 0 && (
        <section className="card item-group">
          <div className="item-group-header">
            <h2 className="item-group-title">En el carro ({inCart.length})</h2>
            <button type="button" className="link-button" onClick={onClearChecked}>
              Vaciar el carro
            </button>
          </div>
          <ul className="items">
            {inCart.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={onToggle} onQuantity={onQuantity} onNote={onNote} onDelete={onDelete} />
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
      {/* La etiqueta entera es pulsable: más fácil de acertar con el dedo en el súper */}
      <label className="item-main">
        <input type="checkbox" className="item-checkbox" checked={item.checked} onChange={() => onToggle(item)} />
        <span className="item-text">
          <span className="item-name">
            {item.name}
            {item.quantity > 1 && <span className="item-quantity"> ×{item.quantity}</span>}
          </span>
          {item.note && <span className="item-note">{item.note}</span>}
          {item.checked && item.checkedByName && <span className="item-note">Lo cogió {item.checkedByName}</span>}
        </span>
      </label>
      {!item.checked && (
        <div className="item-actions">
          <button
            type="button"
            className="icon-button"
            aria-label={`Quitar uno de ${item.name}`}
            disabled={item.quantity <= 1}
            onClick={() => onQuantity(item, item.quantity - 1)}
          >
            −
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={`Añadir uno más de ${item.name}`}
            onClick={() => onQuantity(item, item.quantity + 1)}
          >
            +
          </button>
          <button type="button" className="icon-button" aria-label={`Nota para ${item.name}`} onClick={() => onNote(item)}>
            ✎
          </button>
          <button type="button" className="icon-button danger" aria-label={`Borrar ${item.name}`} onClick={() => onDelete(item)}>
            ✕
          </button>
        </div>
      )}
    </li>
  )
}
