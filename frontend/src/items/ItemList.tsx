import { MoreHorizontal, Minus, Plus, Trash2, Undo2, X } from 'lucide-react'
import { useState } from 'react'
import type { Item } from '@/api/types'
import { BottomSheet } from '@/components/BottomSheet'
import { ChalkStrike } from '@/components/ChalkStrike'
import { EmptyState } from '@/components/EmptyState'
import { ProductDrawing } from '@/components/ProductDrawing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { groupByCategory } from './sortItems'

/** Sección de los productos escritos a mano que no se han podido reconocer. */
export const OTHER_CATEGORY = 'Otros'

type Props = {
  items: Item[]
  onToggle: (item: Item) => void
  onQuantity: (item: Item, quantity: number) => void
  onNote: (item: Item, note: string) => void
  onDelete: (item: Item) => void
}

const HINT_KEY = 'hint-cart-seen'

function hintSeen(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return false // sin almacenamiento (modo privado…): se enseña la pista, no pasa nada
  }
}

/**
 * La lista, como en la pizarra de la cocina: agrupada por sección del súper (en el orden de los
 * pasillos), cada producto con su dibujo de tiza. Lo que se coge se TACHA y se queda en su sitio
 * (como en una pizarra de verdad) hasta que se termina la compra; tocarlo otra vez le quita la raya.
 */
export function ItemList({ items, onToggle, onQuantity, onNote, onDelete }: Props) {
  // Se guarda el id (no el objeto): si otro miembro lo cambia en tiempo real, el panel muestra
  // siempre la versión actual, y si lo borra, el panel se cierra solo
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

  // Quien ya ha tachado algo ya sabe cómo va: la pista sobra
  const toggle = (item: Item) => {
    if (showHint) hideHint()
    onToggle(item)
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="La pizarra está vacía"
        description="Apunta arriba lo que falta en casa, o elige una sección y añádelo desde ahí."
      />
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {showHint && <CartHint onDismiss={hideHint} />}
        {groupByCategory(items).map((group) => {
          const title = group.category ?? OTHER_CATEGORY
          const left = group.items.filter((item) => !item.checked).length
          return (
            <section key={title} aria-label={title}>
              <h2 className="section-title mb-1 inline-flex items-baseline gap-2 text-sm">
                {title}
                <span className="font-normal text-muted-foreground tabular-nums">
                  <span className="sr-only">, faltan </span>
                  {left}
                </span>
              </h2>
              <ul>
                {group.items.map((item) => (
                  <ItemRow key={item.id} item={item} onToggle={toggle} onMore={() => setEditingId(item.id)} />
                ))}
              </ul>
            </section>
          )
        })}
      </div>

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

/** Pista para quien la usa por primera vez: cómo se tacha. */
function CartHint({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div role="note" className="flex items-start gap-3 rounded-lg bg-muted py-3 pr-2 pl-4 text-sm">
      <p className="flex-1 pt-0.5">Cuando cojas algo, tócalo y quedará tachado. Si te equivocas, tócalo otra vez.</p>
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

function ItemRow({ item, onToggle, onMore }: { item: Item; onToggle: (item: Item) => void; onMore: () => void }) {
  const details = `${item.quantity > 1 ? `, ${item.quantity} unidades` : ''}${item.note ? `, ${item.note}` : ''}`
  const label = item.checked ? `${item.name}, tachado. Toca para quitarle la raya` : `${item.name}${details}. Toca para tacharlo`

  return (
    <li className="relative">
      {/* Toda la línea es el botón: un toque la tacha (o le quita la raya) */}
      <button
        type="button"
        aria-pressed={item.checked}
        aria-label={label}
        onClick={() => onToggle(item)}
        className="-mx-2 flex min-h-[4.5rem] w-[calc(100%+1rem)] items-center gap-4 rounded-lg py-2 pr-14 pl-2 text-left outline-none transition-colors duration-150 hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:ring-inset"
      >
        <ProductDrawing name={item.name} categoryName={item.categoryName} quantity={item.quantity} size="md" className={cn('transition-opacity duration-200', item.checked && 'opacity-40')} />
        <span className="relative flex min-w-0 flex-1 flex-col">
          {/* La raya va sobre el nombre, como al tachar una palabra en la pizarra */}
          <span className="relative max-w-full self-start">
            <span className={cn('block truncate text-lg font-semibold transition-opacity duration-200', item.checked && 'opacity-50')}>{item.name}</span>
            {item.checked && <ChalkStrike className="-left-1.5 w-[calc(100%+0.75rem)]" />}
          </span>
          {item.note && <span className={cn('truncate text-sm text-muted-foreground', item.checked && 'opacity-50')}>{item.note}</span>}
        </span>
      </button>

      <button
        type="button"
        aria-label={`Opciones de ${item.name}`}
        onClick={onMore}
        className="absolute top-1/2 right-0 grid size-11 -translate-y-1/2 place-items-center rounded-full text-muted-foreground outline-none transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/60"
      >
        <MoreHorizontal className="chalk size-5" aria-hidden="true" />
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
    <BottomSheet open onClose={onClose} title={item.name} description={item.categoryName ?? 'Escrito a mano'}>
      <div className="flex items-center gap-4">
        <ProductDrawing name={item.name} categoryName={item.categoryName} size="lg" />
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
          {item.addedByName && (
            <>
              <dt className="text-muted-foreground">Lo apuntó</dt>
              <dd className="font-semibold">{item.addedByName}</dd>
            </>
          )}
          {item.checked && item.checkedByName && (
            <>
              <dt className="text-muted-foreground">Lo tachó</dt>
              <dd className="font-semibold">{item.checkedByName}</dd>
            </>
          )}
        </dl>
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

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="lg"
          onClick={() => {
            onToggle(item)
            onClose()
          }}
        >
          {item.checked && <Undo2 aria-hidden="true" />}
          {item.checked ? 'Quitar la raya' : 'Tachar'}
        </Button>
        <Button variant="outline" size="lg" className="text-destructive hover:border-destructive hover:text-destructive" onClick={() => onDelete(item)}>
          <Trash2 aria-hidden="true" />
          Borrar de la lista
        </Button>
      </div>
    </BottomSheet>
  )
}
