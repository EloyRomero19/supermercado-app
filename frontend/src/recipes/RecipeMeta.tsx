import { Clock, Users } from 'lucide-react'
import type { RecipeSummary } from '@/api/types'
import { Badge } from '@/components/ui/badge'

/** Tiempo, raciones y dificultad de una receta. */
export function RecipeMeta({ recipe }: { recipe: Pick<RecipeSummary, 'minutes' | 'servings' | 'difficulty'> }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Clock className="size-3.5" aria-hidden="true" />
        {recipe.minutes} min
      </span>
      <span className="flex items-center gap-1">
        <Users className="size-3.5" aria-hidden="true" />
        {recipe.servings} {recipe.servings === 1 ? 'ración' : 'raciones'}
      </span>
      <Badge variant="secondary" className="h-5 px-1.5 text-[0.7rem]">
        {recipe.difficulty}
      </Badge>
    </span>
  )
}
