import { ArrowLeft, Check, ChefHat, ListPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { addItems, deleteItem, getItems, updateItem } from '@/api/items'
import { getMyLists } from '@/api/lists'
import { getRecipe } from '@/api/recipes'
import type { Item, ListSummary, RecipeDetail } from '@/api/types'
import { AppSkeleton } from '@/components/AppSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { ListPicker } from '@/components/ListPicker'
import { PageHeader } from '@/components/PageHeader'
import { ProductDrawing } from '@/components/ProductDrawing'
import { SubmitButton } from '@/components/SubmitButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage } from '@/items/itemFeedback'
import { lastListId, rememberLastList } from '@/lists/lastList'
import { pickListToShop } from '@/lists/pickListToShop'
import { cn } from '@/lib/utils'
import { ingredientNote, splitIngredients } from '@/recipes/missingIngredients'
import { RecipeArt } from '@/recipes/RecipeArt'
import { RecipeMeta } from '@/recipes/RecipeMeta'

type Loaded = { recipe: RecipeDetail; lists: ListSummary[] }

/** Una receta: qué ingredientes faltan en la lista elegida, añadirlos de una vez y cómo se prepara. */
export function RecipePage() {
  const { recipeId = '' } = useParams()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [listItems, setListItems] = useState<{ listId: string; items: Item[] } | null>(null)
  // Ingredientes que el usuario NO quiere añadir (por defecto se añaden todos los que faltan)
  const [skipped, setSkipped] = useState<ReadonlySet<number>>(new Set())
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let ignore = false
    Promise.all([getRecipe(Number(recipeId)), getMyLists()])
      .then(([recipe, lists]) => {
        if (ignore) return
        setLoaded({ recipe, lists })
        setTargetId(pickListToShop(lists, lastListId())?.id ?? null)
      })
      .catch((e: unknown) => !ignore && setError(errorMessage(e)))
    return () => {
      ignore = true
    }
  }, [recipeId])

  // Lo que ya hay en la lista elegida, para saber qué ingredientes faltan
  useEffect(() => {
    if (!targetId) return
    let ignore = false
    getItems(targetId)
      .then((items) => !ignore && setListItems({ listId: targetId, items }))
      .catch((e: unknown) => !ignore && toast.error(errorMessage(e)))
    return () => {
      ignore = true
    }
  }, [targetId])

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl p-4">
        <EmptyState
          icon={<ChefHat />}
          title="Receta no disponible"
          description={error}
          action={
            <Button asChild>
              <Link to="/recetas">Ver todas las recetas</Link>
            </Button>
          }
        />
      </main>
    )
  }
  if (!loaded) return <AppSkeleton label="Cargando la receta" />

  const { recipe, lists } = loaded
  const target = lists.find((list) => list.id === targetId) ?? null
  const items = listItems?.listId === targetId ? listItems.items : null
  const split = items ? splitIngredients(recipe.ingredients, items) : null
  const toAdd = split ? split.missing.filter((ingredient) => !skipped.has(ingredient.productId)) : []

  const toggleSkipped = (productId: number) =>
    setSkipped((current) => {
      const next = new Set(current)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })

  const addMissing = async () => {
    if (!target || toAdd.length === 0) return
    // Cómo estaba cada producto antes de añadir. Normalmente todos son nuevos, pero si alguien añade
    // el mismo producto mientras miras la receta, el backend suma la cantidad a SU producto: al
    // deshacer, ese se devuelve a como estaba en vez de borrarlo.
    const before = new Map((items ?? []).map((item) => [item.id, item]))
    setAdding(true)
    try {
      const saved = await addItems(
        target.id,
        toAdd.map((ingredient) => ({ productId: ingredient.productId, note: ingredientNote(ingredient, recipe.name) })),
      )
      setListItems((current) => current && { ...current, items: [...current.items.filter((i) => !saved.some((s) => s.id === i.id)), ...saved] })
      rememberLastList(target.id)
      toast.success(`${saved.length} ${saved.length === 1 ? 'ingrediente añadido' : 'ingredientes añadidos'} a «${target.name}»`, {
        action: {
          label: 'Deshacer',
          onClick: async () => {
            try {
              const restored = await Promise.all(
                saved.map(async (item) => {
                  const previous = before.get(item.id)
                  if (!previous) {
                    await deleteItem(target.id, item.id)
                    return null
                  }
                  return updateItem(target.id, item.id, { quantity: previous.quantity, note: previous.note ?? '' })
                }),
              )
              setListItems(
                (current) =>
                  current && {
                    ...current,
                    items: [
                      ...current.items.filter((i) => !saved.some((s) => s.id === i.id)),
                      ...restored.filter((item): item is Item => item !== null),
                    ],
                  },
              )
            } catch (e) {
              toast.error(errorMessage(e))
            }
          },
        },
      })
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      <PageHeader
        title={recipe.name}
        innerClassName="max-w-5xl"
        leading={
          <Button variant="ghost" size="icon" className="-ml-2 size-11" aria-label="Volver a las recetas" onClick={() => navigate('/recetas')}>
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Button>
        }
      />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-4 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <RecipeArt name={recipe.name} className="aspect-[16/9] w-full sm:w-72" />
          <div className="flex max-w-prose flex-col gap-2">
            <p className="text-muted-foreground">{recipe.description}</p>
            <RecipeMeta recipe={recipe} />
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {lists.length === 0 ? (
            <EmptyState
              icon={<ListPlus />}
              title="Crea una lista para añadir los ingredientes"
              description="Así podrás apuntar de una vez todo lo que necesitas para este plato."
              action={
                <Button asChild>
                  <Link to="/">Crear lista</Link>
                </Button>
              }
            />
          ) : (
            <section aria-labelledby="ingredients-title" className="-mx-4 border-y bg-card sm:mx-0 sm:rounded-xl sm:border">
              <div className="flex flex-col gap-3 border-b px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 id="ingredients-title" className="section-title text-base">
                    Ingredientes
                  </h2>
                  {split && (
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {split.missing.length === 0 ? 'Ya los tienes todos' : `Te faltan ${split.missing.length} de ${recipe.ingredients.length}`}
                    </span>
                  )}
                </div>
                {target && <ListPicker lists={lists} value={target.id} onChange={setTargetId} label="Para la lista" />}
              </div>

              <ul className="divide-y">
                {recipe.ingredients.map((ingredient) => {
                  const inList = split?.inList.includes(ingredient) ?? false
                  const selected = !inList && !skipped.has(ingredient.productId)
                  return (
                    <li key={ingredient.productId}>
                      <label className={cn('flex min-h-[4.5rem] items-center gap-3 px-4 py-2', !inList && 'cursor-pointer transition-colors duration-150 hover:bg-muted/60')}>
                        {split === null ? (
                          <Skeleton className="size-5 shrink-0" />
                        ) : inList ? (
                          <Check className="size-5 shrink-0 text-primary" aria-hidden="true" />
                        ) : (
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSkipped(ingredient.productId)}
                            aria-label={`Añadir ${ingredient.name}`}
                            className="size-6 shrink-0 cursor-pointer rounded-sm accent-primary"
                          />
                        )}
                        <ProductDrawing name={ingredient.name} categoryName={ingredient.categoryName} size="md" />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className={cn('font-semibold', inList && 'text-muted-foreground')}>{ingredient.name}</span>
                          <span className="text-sm text-muted-foreground">{ingredient.amount}</span>
                        </span>
                        {inList && (
                          <Badge variant="secondary" className="shrink-0">
                            En tu lista
                          </Badge>
                        )}
                      </label>
                    </li>
                  )
                })}
              </ul>

              {target && split && split.missing.length > 0 && (
                <form
                  className="border-t px-4 py-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    addMissing()
                  }}
                >
                  <SubmitButton submitting={adding} submittingLabel="Añadiendo…" className="w-full" disabled={toAdd.length === 0}>
                    {toAdd.length === 0
                      ? 'Marca lo que quieras añadir'
                      : `Añadir ${toAdd.length} ${toAdd.length === 1 ? 'ingrediente' : 'ingredientes'} a «${target.name}»`}
                  </SubmitButton>
                </form>
              )}
              {target && split && split.missing.length === 0 && (
                <div className="border-t px-4 py-3">
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <Link to={`/listas/${target.id}`}>Ver la lista</Link>
                  </Button>
                </div>
              )}
            </section>
          )}

          <section aria-labelledby="steps-title" className="px-0 py-1">
            <h2 id="steps-title" className="section-title mb-3 text-base">
              Preparación
            </h2>
            {/* Los pasos sí son una secuencia: van numerados */}
            <ol className="flex flex-col divide-y">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-3 py-2.5 leading-relaxed">
                  <span className="w-5 shrink-0 font-semibold text-muted-foreground tabular-nums" aria-hidden="true">
                    {index + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>
    </>
  )
}
