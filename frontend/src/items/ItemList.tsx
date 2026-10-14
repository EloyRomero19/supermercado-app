import { Check, MoreHorizontal, ShoppingCart, Trash2, Undo2 } from 'lucide-react'
import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Item } from '@/api/types'
import { BottomSheet } from '@/components/BottomSheet'
import { EmptyState } from '@/components/EmptyState'
import { ProductIcon } from '@/components/ProductIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { categoryStyle, OTHER_CATEGORY } from './categoryStyle'
import { groupByCategory } from './sortItems'

type Props = {
  items: Item[]
  onToggle: (item: Item) => void
  onQuantity: (item: Item, quantity: number) => void
  onNote: (item: Item, note: string) => void
  onDelete: (item: Item) => void
  onClearChecked: () => void
}

/** Los productos de la lista como tarjetas, agrupadas por sección del súper. */
export function ItemList({ items, onToggle, onQuantity, onNote, onDelete, onClearChecked }: Props) {
  // Se guarda el id (no el objeto): si otro miembro lo cambia en tiempo real, el panel muestra
  // siempre la versión actual, y si lo borra, el panel se cierra solo
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = items.find((item) => item.id === editingId) ?? null

  const pending = items.filter((item) => !item.checked)
  const inCart = items.filter((item) => item.checked)

  if (items.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Tu lista está vacía"
        description="Busca arriba lo que necesitas o elige en «Explorar por secciones». Lo que añadas aparecerá aquí."
      />
    )
  }

  return (
    <>
      {pending.length === 0 ? (
        <EmptyState icon="🎉" title="¡Todo en el carrito!" description="Ya tienes todo lo de la lista. Buen trabajo." />
      ) : (
        groupByCategory(pending).map((group) => {
          const style = categoryStyle(group.category)
          return (
            <section key={group.category ?? OTHER_CATEGORY} aria-label={group.category ?? OTHER_CATEGORY} style={{ '--tone': style.color } as CSSProperties}>
              <SectionTitle icon={style.icon} title={group.category ?? OTHER_CATEGORY} count={group.items.length} tone />
              <TileGrid>
                {group.items.map((item) => (
                  <ItemTile key={item.id} item={item} onToggle={onToggle} onMore={() => setEditingId(item.id)} />
                ))}
              </TileGrid>
            </section>
          )
        })
      )}

      {inCart.length > 0 && (
        <section aria-label="En el carrito" className="rounded-2xl bg-muted/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle icon={<ShoppingCart className="size-4" />} title="En el carrito" count={inCart.length} />
            <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={onClearChecked}>
              <Trash2 aria-hidden="true" />
              Vaciar
            </Button>
          </div>
          <p className="mb-2 px-1 text-xs text-muted-foreground">Toca un producto para devolverlo a la lista.</p>
          <TileGrid>
            {inCart.map((item) => (
              <ItemTile key={item.id} item={item} onToggle={onToggle} onMore={() => setEditingId(item.id)} />
            ))}
          </TileGrid>
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

function SectionTitle({ icon, title, count, tone = false }: { icon: ReactNode; title: string; count: number; tone?: boolean }) {
  return (
    <h2 className={cn('mb-2 flex items-center gap-2 px-1 text-sm font-semibold', tone ? 'text-(--tone)' : 'text-muted-foreground')}>
      <span aria-hidden="true">{icon}</span>
      {title}
      <span className={cn('rounded-full px-2 text-xs font-semibold tabular-nums', tone ? 'bg-tone-soft' : 'bg-card')}>{count}</span>
    </h2>
  )
}

function TileGrid({ children }: { children: ReactNode }) {
  // Tantas columnas de ~6,5rem como quepan: 3 en un móvil, más en pantallas anchas
  return <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2.5">{children}</ul>
}

function ItemTile({ item, onToggle, onMore }: { item: Item; onToggle: (item: Item) => void; onMore: () => void }) {
  const style = categoryStyle(item.categoryName)
  const label = `${item.name}${item.quantity > 1 ? `, ${item.quantity} unidades` : ''}${item.note ? `, ${item.note}` : ''}`

  return (
    <li className="relative motion-safe:animate-tile-in" style={{ '--tone': style.color } as CSSProperties}>
      {/* Toda la tarjeta es el botón: un toque la manda al carrito (aria-pressed = "marcada") */}
      <button
        type="button"
        aria-pressed={item.checked}
        aria-label={label}
        onClick={() => onToggle(item)}
        className={cn(
          'flex aspect-[4/5] w-full flex-col items-center justify-center gap-1 rounded-xl border p-2 pt-8 text-center outline-none',
          'transition-[transform,opacity,background-color] duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95',
          item.checked ? 'border-border bg-card opacity-60' : 'bg-tone-soft border-tone-soft hover:brightness-[0.98]',
        )}
      >
        <span className={cn('text-4xl leading-none transition-[filter]', item.checked && 'grayscale')} aria-hidden="true">
          {item.icon ?? style.icon}
        </span>
        <span className={cn('line-clamp-2 text-sm leading-tight font-semibold', item.checked && 'text-muted-foreground line-through')}>
          {item.name}
          {/* La cantidad junto al nombre (una insignia aparte tapaba el texto en tarjetas estrechas) */}
          {item.quantity > 1 && <span className={cn('font-bold whitespace-nowrap', !item.checked && 'text-(--tone)')}> ×{item.quantity}</span>}
        </span>
        {item.note && <span className="w-full truncate text-xs text-muted-foreground">{item.note}</span>}
      </button>

      {/* Casilla grande (decorativa: el estado lo anuncia aria-pressed del botón) */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-2 left-2 grid size-7 place-items-center rounded-full border-2 transition-colors',
          item.checked ? 'border-primary bg-primary text-primary-foreground motion-safe:animate-pop' : 'border-muted-foreground/40 bg-card',
        )}
      >
        {item.checked && <Check className="size-4" strokeWidth={3} />}
      </span>


      <button
        type="button"
        aria-label={`Opciones de ${item.name}`}
        onClick={onMore}
        className="absolute top-1 right-1 grid size-9 place-items-center rounded-full text-muted-foreground outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
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
        <ProductIcon icon={item.icon} categoryName={item.categoryName} size="lg" />
        <div className="text-sm text-muted-foreground">
          {item.addedByName && <p>Lo añadió {item.addedByName}</p>}
          {item.checked && item.checkedByName && <p>✓ Lo cogió {item.checkedByName}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="font-medium" id="quantity-label">
          Cantidad
        </span>
        <div className="flex items-center gap-1 rounded-full border bg-muted/50 p-1" role="group" aria-labelledby="quantity-label">
          <Button variant="ghost" size="icon" className="size-10 rounded-full text-lg" aria-label="Quitar uno" disabled={item.quantity <= 1} onClick={() => onQuantity(item, item.quantity - 1)}>
            −
          </Button>
          <span className="min-w-8 text-center text-lg font-semibold tabular-nums" aria-live="polite">
            {item.quantity}
          </span>
          <Button variant="ghost" size="icon" className="size-10 rounded-full text-lg" aria-label="Añadir uno más" onClick={() => onQuantity(item, item.quantity + 1)}>
            +
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
          <Input id="item-note" className="h-11 flex-1 text-base" placeholder="Marca, tamaño, sin lactosa…" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
          <Button type="submit" className="h-11" disabled={note === (item.note ?? '')}>
            Guardar
          </Button>
        </div>
      </form>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="h-11"
          onClick={() => {
            onToggle(item)
            onClose()
          }}
        >
          {item.checked ? <Undo2 aria-hidden="true" /> : <ShoppingCart aria-hidden="true" />}
          {item.checked ? 'Devolver' : 'Al carrito'}
        </Button>
        <Button variant="outline" className="h-11 text-destructive hover:text-destructive" onClick={() => onDelete(item)}>
          <Trash2 aria-hidden="true" />
          Quitar
        </Button>
      </div>
    </BottomSheet>
  )
}
