import { ArrowLeft, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { addItem, deleteItem, getItems } from '@/api/items'
import { getCategories, getCategoryProducts } from '@/api/products'
import type { Category, Item, Product } from '@/api/types'
import { AppSkeleton } from '@/components/AppSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { ProductTile } from '@/components/ProductTile'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/items/itemFeedback'
import { productDrawing } from '@/products/drawings'

type Loaded = { category: Category; products: Product[]; items: Item[] }

/** Cuántos dibujos de la sección se ven en la cabecera, y su inclinación (como pegados a mano). */
const HEADER_TILTS = ['-rotate-6', 'rotate-3', '-rotate-2']

/**
 * Una sección del súper con TODOS sus productos de la A a la Z, en fichas: teja si ya está en la
 * lista (un toque lo quita), azul si no (un toque lo añade). Para repasar lo que falta sin
 * acordarse del nombre exacto. Al volver, la lista se recarga (se vuelve a montar ListPage).
 */
export function CategoryPage() {
  const { listId = '', categoryId = '' } = useParams()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Productos con una petición en marcha: no se pueden volver a tocar hasta que responda
  const [busy, setBusy] = useState<ReadonlySet<number>>(new Set())

  useEffect(() => {
    let ignore = false
    const id = Number(categoryId)
    Promise.all([getCategories(), getCategoryProducts(id), getItems(listId)])
      .then(([categories, products, items]) => {
        if (ignore) return
        const category = categories.find((c) => c.id === id)
        if (!category) return setError('Esta sección no existe.')
        products.sort((a, b) => a.name.localeCompare(b.name, 'es'))
        setLoaded({ category, products, items })
      })
      .catch((e: unknown) => !ignore && setError(e instanceof ApiError && e.status === 404 ? 'Esta lista no existe o ya no tienes acceso a ella.' : errorMessage(e)))
    return () => {
      ignore = true
    }
  }, [listId, categoryId])

  const back = (
    <Button asChild variant="ghost" size="icon" className="size-11 rounded-full border-2 border-border">
      <Link to={`/listas/${listId}`} aria-label="Volver a la lista">
        <ArrowLeft className="chalk size-5" aria-hidden="true" />
      </Link>
    </Button>
  )

  if (error) {
    return (
      <main className="mx-auto w-full max-w-4xl p-4 lg:px-8">
        <EmptyState icon={<SearchX />} title="Sección no disponible" description={error} action={<Button asChild><Link to={`/listas/${listId}`}>Volver a la lista</Link></Button>} />
      </main>
    )
  }
  if (!loaded) return <AppSkeleton label="Cargando la sección" />

  const { category, products, items } = loaded
  const pendingOf = (productId: number) => items.find((item) => item.productId === productId)
  const inList = products.filter((product) => pendingOf(product.id)).length
  // Tres dibujos distintos de la sección para la cabecera
  const headerDrawings = [...new Set(products.map((p) => productDrawing(p.name, p.categoryName)))].slice(0, HEADER_TILTS.length)

  const setItems = (update: (items: Item[]) => Item[]) => setLoaded((prev) => prev && { ...prev, items: update(prev.items) })
  const setBusyFor = (productId: number, value: boolean) =>
    setBusy((current) => {
      const next = new Set(current)
      if (value) next.add(productId)
      else next.delete(productId)
      return next
    })

  const toggle = async (product: Product) => {
    const pending = pendingOf(product.id)
    setBusyFor(product.id, true)
    try {
      if (pending) {
        setItems((current) => current.filter((item) => item.id !== pending.id)) // optimista
        try {
          await deleteItem(listId, pending.id)
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 404)) {
            setItems((current) => [...current, pending])
            throw e
          }
        }
      } else {
        const saved = await addItem(listId, { productId: product.id })
        setItems((current) => [...current.filter((item) => item.id !== saved.id), saved])
      }
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusyFor(product.id, false)
    }
  }

  return (
    <>
      <header className="mx-auto w-full max-w-4xl px-4 pt-safe lg:px-8">
        <div className="grid h-16 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-3">
          {back}
          <h1 className="chalk-title truncate text-center text-2xl">{category.name}</h1>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 pt-2 pb-6 lg:px-8">
        {headerDrawings.length > 0 && (
          <div className="flex justify-center gap-6 py-2" aria-hidden="true">
            {headerDrawings.map((src, index) => (
              <img key={src} src={src} alt="" decoding="async" draggable={false} className={`size-20 ${HEADER_TILTS[index]}`} />
            ))}
          </div>
        )}

        <section aria-labelledby="az-title">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="az-title" className="section-title text-base">
              De la A a la Z
            </h2>
            <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
              {inList === 0 ? 'Nada de aquí en la lista' : `${inList} en la lista`}
            </p>
          </div>
          {products.length === 0 ? (
            <p className="text-muted-foreground">No hay productos en esta sección.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
              {products.map((product) => {
                const pending = pendingOf(product.id)
                return (
                  <ProductTile
                    key={product.id}
                    tone={pending ? 'need' : 'stock'}
                    name={product.name}
                    categoryName={product.categoryName}
                    quantity={pending?.quantity}
                    busy={busy.has(product.id)}
                    label={pending ? `${product.name} está en la lista. Toca para quitarlo` : `Añadir ${product.name} a la lista`}
                    onClick={() => toggle(product)}
                  />
                )
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
