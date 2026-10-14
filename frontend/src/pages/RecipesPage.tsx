import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getRecipes } from '@/api/recipes'
import type { RecipeSummary } from '@/api/types'
import { CardSkeleton } from '@/components/AppSkeleton'
import { FormAlert } from '@/components/FormAlert'
import { PageHeader } from '@/components/PageHeader'
import { errorMessage } from '@/items/itemFeedback'
import { RecipeMeta } from '@/recipes/RecipeMeta'

/** Pestaña "Recetas": platos típicos; al abrir uno se ve qué ingredientes faltan en tu lista. */
export function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    getRecipes()
      .then((result) => !ignore && setRecipes(result))
      .catch((e: unknown) => !ignore && setError(errorMessage(e)))
    return () => {
      ignore = true
    }
  }, [])

  return (
    <>
      <PageHeader title="Recetas">
        <p className="text-sm text-muted-foreground">Elige un plato y añade a tu lista lo que te falte.</p>
      </PageHeader>
      <main className="flex flex-col gap-3 p-4">
        <FormAlert message={error} />
        {recipes === null && !error && (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando recetas">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}
        {recipes && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="motion-safe:animate-tile-in">
                <Link
                  to={`/recetas/${recipe.id}`}
                  className="group flex h-full items-center gap-4 rounded-2xl border bg-card p-4 shadow-xs outline-none transition-all hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.99]"
                >
                  <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-secondary text-4xl leading-none" aria-hidden="true">
                    {recipe.emoji}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-semibold">{recipe.name}</span>
                    <span className="line-clamp-2 text-sm text-muted-foreground">{recipe.description}</span>
                    <RecipeMeta recipe={recipe} />
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
