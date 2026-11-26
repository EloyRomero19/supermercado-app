import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getCategories } from '@/api/products'
import type { Category } from '@/api/types'
import { categoryDrawingUrl } from './drawings'

/**
 * Las secciones del súper, al final de la lista: cada una abre su página con todos sus productos
 * de la A a la Z (pages/CategoryPage). Para cuando no sabes el nombre exacto o quieres repasar.
 */
export function SectionLinks({ listId }: { listId: string }) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    let ignore = false
    getCategories()
      .then((result) => !ignore && setCategories(result))
      .catch(() => {
        // sin secciones no se muestran; el buscador sigue funcionando
      })
    return () => {
      ignore = true
    }
  }, [])

  if (categories.length === 0) return null

  return (
    <nav aria-labelledby="sections-title">
      <h2 id="sections-title" className="section-title mb-3 text-base">
        Secciones
      </h2>
      <ul className="divide-y overflow-hidden rounded-lg bg-card">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              to={`/listas/${listId}/seccion/${category.id}`}
              className="flex min-h-15 items-center gap-3 px-3 py-2 font-semibold outline-none transition-colors duration-150 hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:ring-inset"
            >
              <img src={categoryDrawingUrl(category.name)} alt="" decoding="async" draggable={false} className="size-10 shrink-0" />
              <span className="min-w-0 flex-1">{category.name}</span>
              <ChevronRight className="chalk size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
