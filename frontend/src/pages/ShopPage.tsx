import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { getMyLists } from '../api/lists'
import { LoadingScreen } from '../components/LoadingScreen'
import { lastListId } from '../lists/lastList'
import { pickListToShop } from '../lists/pickListToShop'

/** Pestaña "Comprar": decide qué lista abrir y redirige a ella. */
export function ShopPage() {
  const navigate = useNavigate()
  const [problem, setProblem] = useState<'no-lists' | string | null>(null)

  useEffect(() => {
    let ignore = false
    getMyLists()
      .then((lists) => {
        if (ignore) return
        const target = pickListToShop(lists, lastListId())
        // replace: el botón "atrás" no vuelve a esta página intermedia
        if (target) navigate(`/listas/${target.id}`, { replace: true })
        else setProblem('no-lists')
      })
      .catch((error: unknown) => !ignore && setProblem(error instanceof ApiError ? error.message : 'No se pudo cargar'))
    return () => {
      ignore = true
    }
  }, [navigate])

  if (problem === null) return <LoadingScreen />
  return (
    <div className="page">
      <main className="content center-screen">
        <section className="card empty-state">
          <span className="empty-emoji" aria-hidden="true">
            🛒
          </span>
          {problem === 'no-lists' ? (
            <>
              <h2>Aún no tienes ninguna lista</h2>
              <p className="muted">Crea tu primera lista para empezar a apuntar lo que necesitas.</p>
              <Link to="/" className="button">
                Crear una lista
              </Link>
            </>
          ) : (
            <p className="alert" role="alert">{problem}</p>
          )}
        </section>
      </main>
    </div>
  )
}
