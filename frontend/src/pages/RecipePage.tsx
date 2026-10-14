import { ArrowLeft, Check, ListPlus, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { addItems, deleteItem, getItems } from '@/api/items'
import { getMyLists } from '@/api/lists'
import { getRecipe } from '@/api/recipes'
import type { Item, ListSummary, RecipeDetail } from '@/api/types'
import { AppSkeleton } from '@/components/AppSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { ListPicker } from '@/components/ListPicker'
import { PageHeader } from '@/components/PageHeader'
import { ProductIcon } from '@/components/ProductIcon'
import { SubmitButton } from '@/components/SubmitButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage } from '@/items/itemFeedback'
import { lastListId, rememberLastList } from '@/lists/lastList'
import { pickListToShop } from '@/lists/pickListToShop'
import { cn } from '@/lib/utils'
import { ingredientNote, splitIngredients } from '@/recipes/missingIngredients'
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
      <main className="grid flex-1 place-items-center p-4">
        <EmptyState
          icon="🍳"
          title="Receta no disponible"
          description={error}
          action={
            <Button asChild size="lg">
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
              // Solo se añadieron los que faltaban, así que todos son nuevos: deshacer = quitarlos
              await Promise.all(saved.map((item) => deleteItem(target.id, item.id)))
              setListItems((current) => current && { ...current, items: current.items.filter((i) => !saved.some((s) => s.id === i.id)) })
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
        leading={
          <Button variant="ghost" size="icon" className="-ml-2 size-11" aria-label="Volver a las recetas" onClick={() => navigate('/recetas')}>
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Button>
        }
      />

      <main className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <span className="grid size-20 shrink-0 place-items-center rounded-3xl bg-secondary text-5xl leading-none" aria-hidden="true">
            {recipe.emoji}
          </span>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{recipe.description}</p>
            <RecipeMeta recipe={recipe} />
          </div>
        </div>

        {lists.length === 0 ? (
          <EmptyState
            icon={<ListPlus className="size-7" />}
            title="Crea una lista para añadir los ingredientes"
            description="Así podrás apuntar de una vez todo lo que necesitas para este plato."
            action={
              <Button asChild size="lg">
                <Link to="/">Crear una lista</Link>
              </Button>
            }
          />
        ) : (
          <Card className="gap-4 px-4 py-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">Ingredientes</h2>
              {split && (
                <span className="text-sm text-muted-foreground">
                  {split.missing.length === 0 ? 'Ya los tienes todos' : `Te faltan ${split.missing.length} de ${recipe.ingredients.length}`}
                </span>
              )}
            </div>

            {target && <ListPicker lists={lists} value={target.id} onChange={setTargetId} label="Para la lista" />}

            <ul className="flex flex-col">
              {recipe.ingredients.map((ingredient) => {
                const inList = split?.inList.includes(ingredient) ?? false
                const selected = !inList && !skipped.has(ingredient.productId)
                return (
                  <li key={ingredient.productId}>
                    <label className={cn('flex min-h-14 items-center gap-3 rounded-xl px-1', !inList && 'cursor-pointer hover:bg-muted')}>
                      <ProductIcon icon={ingredient.icon} categoryName={ingredient.categoryName} size="sm" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className={cn('font-medium', inList && 'text-muted-foreground')}>{ingredient.name}</span>
                        <span className="text-xs text-muted-foreground">{ingredient.amount}</span>
                      </span>
                      {split === null ? (
                        <Skeleton className="size-6 rounded-md" />
                      ) : inList ? (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="size-3" aria-hidden="true" />
                          En tu lista
                        </Badge>
                      ) : (
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSkipped(ingredient.productId)}
                          aria-label={`Añadir ${ingredient.name}`}
                          className="size-6 shrink-0 cursor-pointer accent-primary"
                        />
                      )}
                    </label>
                  </li>
                )
              })}
            </ul>

            {target && split && split.missing.length > 0 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  addMissing()
                }}
              >
                <SubmitButton submitting={adding} submittingLabel="Añadiendo…" className="w-full" disabled={toAdd.length === 0}>
                  <ShoppingCart aria-hidden="true" />
                  {toAdd.length === 0
                    ? 'Marca lo que quieras añadir'
                    : `Añadir ${toAdd.length} ${toAdd.length === 1 ? 'ingrediente' : 'ingredientes'} a «${target.name}»`}
                </SubmitButton>
              </form>
            )}
            {target && split && split.missing.length === 0 && (
              <Button asChild variant="secondary" size="lg" className="h-11">
                <Link to={`/listas/${target.id}`}>Ver la lista</Link>
              </Button>
            )}
          </Card>
        )}

        <Card className="gap-3 px-4 py-4">
          <h2 className="font-semibold">Preparación</h2>
          <ol className="flex flex-col gap-3">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm leading-relaxed">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </main>
    </>
  )
}
