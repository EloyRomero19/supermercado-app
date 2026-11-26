import { Minus, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { Item } from '@/api/types'
import { BottomSheet } from '@/components/BottomSheet'
import { ProductDrawing } from '@/components/ProductDrawing'
import { ProductTile } from '@/components/ProductTile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { tileTransitionName } from '@/lib/viewTransition'

type Props = {
  /** Solo lo pendiente, ya ordenado (por sección del súper y luego alfabético) */
  items: Item[]
  /** Un toque: ya lo tienes, fuera de la lista */
  onTake: (item: Item) => void
  onQuantity: (item: Item, quantity: number) => void
  onNote: (item: Item, note: string) => void
}

const HINT_KEY = 'hint-tiles-seen'

function hintSeen(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return false // sin almacenamiento (modo privado…): se enseña la pista, no pasa nada
  }
}

/**
 * Lo que falta, en fichas de color teja: un toque y desaparece (ya lo tienes). Sin carrito ni
 * tachado: la lista es SOLO lo que falta. Manteniendo pulsado se cambian cantidad y nota.
 * Van en el orden de los pasillos (sortItems), así se recorre el súper de una pasada.
 */
export function ItemList({ items, onTake, onQuantity, onNote }: Props) {
  // Se guarda el id (no el objeto): si otro miembro lo cambia en tiempo real, el panel muestra
  // siempre la versión actual, y si lo quita, el panel se cierra solo
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = items.find((item) => item.id === editingId) ?? null
  const [showHint, setShowHint] = useState(() => !hintSeen())

  const hideHint = () => {
    setShowHint(false)
    try {
      localStorage.setItem(HINT_KEY, '1')
    } catch {
      // sin almacenamiento: la pista volverá a salir la próxima vez
    }
  }

  // Quien ya ha quitado algo ya sabe cómo va: la pista sobra
  const take = (item: Item) => {
    if (showHint) hideHint()
    onTake(item)
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border-2 border-dashed border-border px-4 py-6 text-muted-foreground">
        No falta nada. Escribe abajo lo que necesites, o tócalo en «Otras veces».
      </p>
    )
  }

  return (
    <>
      {showHint && <TileHint onDismiss={hideHint} />}
      <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => (
          <ProductTile
            key={item.id}
            tone="need"
            name={item.name}
            categoryName={item.categoryName}
            note={item.note}
            quantity={item.quantity}
            label={`${item.name}${item.quantity > 1 ? `, ${item.quantity} unidades` : ''}${item.note ? `, ${item.note}` : ''}. Toca cuando lo tengas para quitarlo de la lista`}
            transitionName={tileTransitionName(item.productId, item.name)}
            onClick={() => take(item)}
            onLongPress={() => setEditingId(item.id)}
          />
        ))}
      </ul>

      {editing && (
        <ItemSheet
          // key: al abrir otro producto, el formulario de la nota empieza de cero
          key={editing.id}
          item={editing}
          onClose={() => setEditingId(null)}
          onQuantity={onQuantity}
          onNote={onNote}
          onRemove={(item) => {
            setEditingId(null)
            take(item)
          }}
        />
      )}
    </>
  )
}

/** Pista para quien la usa por primera vez. */
function TileHint({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div role="note" className="mb-3 flex items-start gap-3 rounded-lg bg-muted py-3 pr-2 pl-4 text-sm">
      <p className="flex-1 pt-0.5">Cuando cojas algo, tócalo y desaparece de la lista. Mantén pulsado para cambiar la cantidad o añadir una nota.</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar la pista"
        className="-my-1 grid size-9 shrink-0 place-items-center rounded-full outline-none transition-colors duration-150 hover:bg-background/60 focus-visible:ring-[3px] focus-visible:ring-ring/60"
      >
        <X className="chalk size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

type SheetProps = {
  item: Item
  onClose: () => void
  onQuantity: (item: Item, quantity: number) => void
  onNote: (item: Item, note: string) => void
  onRemove: (item: Item) => void
}

/** Lo que se puede cambiar de un producto de la lista. */
function ItemSheet({ item, onClose, onQuantity, onNote, onRemove }: SheetProps) {
  const [note, setNote] = useState(item.note ?? '')

  return (
    <BottomSheet open onClose={onClose} title={item.name} description={item.categoryName ?? 'Escrito a mano'}>
      <div className="flex items-center gap-4">
        <ProductDrawing name={item.name} categoryName={item.categoryName} size="lg" />
        {item.addedByName && (
          <p className="text-sm">
            <span className="text-muted-foreground">Lo apuntó </span>
            <span className="font-semibold">{item.addedByName}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-y py-3">
        <span className="font-semibold text-section" id="quantity-label">
          Cantidad
        </span>
        <div className="flex h-11 items-center rounded-full border border-input" role="group" aria-labelledby="quantity-label">
          <Button variant="ghost" size="icon" className="size-11" aria-label="Quitar uno" disabled={item.quantity <= 1} onClick={() => onQuantity(item, item.quantity - 1)}>
            <Minus aria-hidden="true" />
          </Button>
          <span key={item.quantity} className="min-w-10 animate-pop-in text-center font-bold tabular-nums" aria-live="polite">
            {item.quantity}
          </span>
          <Button variant="ghost" size="icon" className="size-11" aria-label="Añadir uno más" onClick={() => onQuantity(item, item.quantity + 1)}>
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </div>

      <form
        className="flex flex-col gap-1.5"
        onSubmit={(e) => {
          e.preventDefault()
          onNote(item, note)
          onClose()
        }}
      >
        <Label htmlFor="item-note">Nota</Label>
        <div className="flex gap-2">
          <Input id="item-note" className="h-11 flex-1" placeholder="Marca, tamaño, sin lactosa…" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
          <Button type="submit" variant="outline" className="h-11" disabled={note === (item.note ?? '')}>
            Guardar nota
          </Button>
        </div>
      </form>

      <Button variant="outline" size="lg" className="text-destructive hover:border-destructive hover:text-destructive" onClick={() => onRemove(item)}>
        <Trash2 aria-hidden="true" />
        Quitar de la lista
      </Button>
    </BottomSheet>
  )
}
