import { useState, type CSSProperties } from 'react'
import type { Item } from '../api/types'
import { ProductIcon } from '../components/ProductIcon'
import { Sheet } from '../components/Sheet'
import { categoryStyle } from './categoryStyle'

type Props = {
  items: Item[]
  onToggle: (item: Item) => void
  onQuantity: (item: Item, quantity: number) => void
  onNote: (item: Item, note: string) => void
  onDelete: (item: Item) => void
  onClearChecked: () => void
}

/** Los productos de la lista como tarjetas grandes, agrupadas por sección del súper. */
export function ItemList({ items, onToggle, onQuantity, onNote, onDelete, onClearChecked }: Props) {
  // Se guarda el id (no el objeto): si otro miembro lo cambia en tiempo real, el panel muestra
  // siempre la versión actual, y si lo borra, el panel se cierra solo
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = items.find((item) => item.id === editingId) ?? null

  const pending = items.filter((item) => !item.checked)
  const inCart = items.filter((item) => item.checked)

  if (items.length === 0) {
    return (
      <section className="card empty-state">
        <span className="empty-emoji" aria-hidden="true">
          🛒
        </span>
        <h2>Tu lista está vacía</h2>
        <p className="muted">Busca arriba o explora las secciones de abajo: lo que añadas aparecerá aquí.</p>
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
        // Una sola cuadrícula, en el orden del súper: el color de cada tarjeta ya indica su sección
        <section className="tile-group">
          <h2 className="group-title">
            Por comprar
            <span className="group-count">{pending.length}</span>
          </h2>
          <ul className="tiles">
            {pending.map((item) => (
              <ItemTile key={item.id} item={item} onToggle={onToggle} onMore={() => setEditingId(item.id)} />
            ))}
          </ul>
        </section>
      )}

      {inCart.length > 0 && (
        <section className="tile-group tile-group-cart">
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
          <p className="group-hint">Toca un producto para devolverlo a la lista.</p>
          <ul className="tiles">
            {inCart.map((item) => (
              <ItemTile key={item.id} item={item} onToggle={onToggle} onMore={() => setEditingId(item.id)} />
            ))}
          </ul>
        </section>
      )}

      {editing && (
        <ItemSheet
          // key: al abrir otro producto, el formulario de la nota empieza de cero
          key={editing.id}
          item={editing}
          onClose={() => setEditingId(null)}
          onToggle={onToggle}
          onQuantity={onQuantity}
          onNote={onNote}
          onDelete={(item) => {
            setEditingId(null)
            onDelete(item)
          }}
        />
      )}
    </>
  )
}

function ItemTile({ item, onToggle, onMore }: { item: Item; onToggle: (item: Item) => void; onMore: () => void }) {
  const style = categoryStyle(item.categoryName)
  const label = `${item.name}${item.quantity > 1 ? `, ${item.quantity} unidades` : ''}`

  return (
    <li className={item.checked ? 'tile tile-checked' : 'tile'} style={{ '--tone': style.color } as CSSProperties}>
      {/* Toda la tarjeta es el botón: un toque la manda al carro (aria-pressed = "marcada") */}
      <button type="button" className="tile-main" aria-pressed={item.checked} aria-label={label} onClick={() => onToggle(item)}>
        <span className="tile-icon" aria-hidden="true">
          {item.icon ?? style.icon}
        </span>
        <span className="tile-name">{item.name}</span>
        {item.note && <span className="tile-note">{item.note}</span>}
      </button>
      {item.quantity > 1 && <span className="tile-quantity">×{item.quantity}</span>}
      {item.checked && (
        <span className="tile-done" aria-hidden="true">
          ✓
        </span>
      )}
      <button type="button" className="tile-more" aria-label={`Opciones de ${item.name}`} onClick={onMore}>
        ⋯
      </button>
    </li>
  )
}

type SheetProps = {
  item: Item
  onClose: () => void
  onToggle: (item: Item) => void
  onQuantity: (item: Item, quantity: number) => void
  onNote: (item: Item, note: string) => void
  onDelete: (item: Item) => void
}

/** Panel con todo lo que se puede hacer con un producto. */
function ItemSheet({ item, onClose, onToggle, onQuantity, onNote, onDelete }: SheetProps) {
  const [note, setNote] = useState(item.note ?? '')

  return (
    <Sheet open onClose={onClose} title={item.name}>
      <div className="item-sheet-head">
        <ProductIcon icon={item.icon} categoryName={item.categoryName} size="lg" />
        <div>
          <p className="muted">{item.categoryName ?? 'Escrito a mano'}</p>
          {item.addedByName && <p className="muted small">Lo añadió {item.addedByName}</p>}
          {item.checked && item.checkedByName && <p className="muted small">✓ Lo cogió {item.checkedByName}</p>}
        </div>
      </div>

      <div className="sheet-row">
        <span className="sheet-label">Cantidad</span>
        <div className="stepper" role="group" aria-label={`Cantidad de ${item.name}`}>
          <button
            type="button"
            aria-label="Quitar uno"
            disabled={item.quantity <= 1}
            onClick={() => onQuantity(item, item.quantity - 1)}
          >
            −
          </button>
          <span aria-live="polite">{item.quantity}</span>
          <button type="button" aria-label="Añadir uno más" onClick={() => onQuantity(item, item.quantity + 1)}>
            +
          </button>
        </div>
      </div>

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          onNote(item, note)
          onClose()
        }}
      >
        <label className="sheet-label" htmlFor="item-note">
          Nota
        </label>
        <div className="inline-form">
          <input
            id="item-note"
            className="input"
            placeholder="Marca, tamaño, sin lactosa…"
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button type="submit" className="button" disabled={note === (item.note ?? '')}>
            Guardar
          </button>
        </div>
      </form>

      <div className="actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            onToggle(item)
            onClose()
          }}
        >
          {item.checked ? '↩ Devolver a la lista' : '🛒 Al carro'}
        </button>
        <button type="button" className="button button-danger" onClick={() => onDelete(item)}>
          🗑 Quitar
        </button>
      </div>
    </Sheet>
  )
}
