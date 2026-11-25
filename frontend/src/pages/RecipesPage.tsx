import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getRecipes } from '@/api/recipes'
import type { RecipeSummary } from '@/api/types'
import { RowSkeleton } from '@/components/AppSkeleton'
import { FormAlert } from '@/components/FormAlert'
import { PageHeader } from '@/components/PageHeader'
import { errorMessage } from '@/items/itemFeedback'
import { RecipeArt } from '@/recipes/RecipeArt'
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
      <PageHeader title="Recetas" />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-5 lg:mx-0 lg:px-8">
        <p className="text-muted-foreground">Elige un plato y te decimos qué ingredientes faltan en tu lista. Los añades con un toque.</p>
        <FormAlert message={error} />
        {recipes === null && !error && (
          <div className="divide-y" aria-busy="true" aria-label="Cargando recetas">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        )}
        {recipes && (
          <ul className="divide-y">
            {recipes.map((recipe) => (
              <li key={recipe.id}>
                <Link
                  to={`/recetas/${recipe.id}`}
                  className="group -mx-2 flex items-center gap-4 rounded-lg px-2 py-3 outline-none transition-colors duration-150 hover:bg-muted/70 focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset"
                >
                  <RecipeArt name={recipe.name} className="size-24 shrink-0 sm:size-28" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-lg leading-tight font-bold">{recipe.name}</span>
                    <span className="line-clamp-2 text-sm text-muted-foreground">{recipe.description}</span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <RecipeMeta recipe={recipe} />
                      <span className="text-xs text-muted-foreground">{recipe.ingredientCount} ingredientes</span>
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}

