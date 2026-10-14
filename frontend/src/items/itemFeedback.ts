import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { addItem, deleteItem, updateItem, type NewItem } from '@/api/items'
import type { Item } from '@/api/types'

type Callbacks = {
  /** El producto quedó guardado (nuevo o con más cantidad) */
  onSaved: (item: Item) => void
  /** Se deshizo el alta de un producto nuevo */
  onRemoved: (itemId: string) => void
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Ha ocurrido un error'
}

/**
 * Añade un producto y lo confirma con un aviso que permite deshacerlo. Si el producto ya estaba
 * pendiente, el backend suma la cantidad: entonces "Deshacer" vuelve a la cantidad anterior en vez
 * de borrar el producto entero.
 */
export async function addWithUndo(listId: string, newItem: NewItem, current: Item[], callbacks: Callbacks, listName?: string) {
  try {
    const saved = await addItem(listId, newItem)
    const before = current.find((item) => item.id === saved.id)
    callbacks.onSaved(saved)
    const message = before ? `${saved.name}: ahora ×${saved.quantity}` : `«${saved.name}» añadido${listName ? ` a ${listName}` : ''}`
    toast.success(message, {
      action: {
        label: 'Deshacer',
        onClick: async () => {
          try {
            if (before) {
              callbacks.onSaved(await updateItem(listId, saved.id, { quantity: before.quantity }))
            } else {
              await deleteItem(listId, saved.id)
              callbacks.onRemoved(saved.id)
            }
          } catch (error) {
            toast.error(errorMessage(error))
          }
        },
      },
    })
    return saved
  } catch (error) {
    toast.error(errorMessage(error))
    return null
  }
}
