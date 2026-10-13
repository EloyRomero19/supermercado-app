import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { joinList } from '../api/lists'
import { LoadingScreen } from '../components/LoadingScreen'

/**
 * Destino del enlace de invitación (/unirse/K7MX4QPA). Es una ruta protegida: si no hay sesión,
 * RequireAuth manda a /login y, tras entrar, GuestOnly devuelve aquí para completar la unión.
 */
export function JoinPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    joinList(code)
      .then((list) => !ignore && navigate(`/listas/${list.id}`, { replace: true }))
      .catch((e: unknown) => !ignore && setError(e instanceof ApiError ? e.message : 'No se pudo unir a la lista'))
    return () => {
      ignore = true
    }
  }, [code, navigate])

  if (!error) return <LoadingScreen message="Uniéndote a la lista…" />
  return (
    <main className="center-screen">
      <div className="card empty-state">
        <p className="alert" role="alert">{error}</p>
        <Link to="/">Ir a mis listas</Link>
      </div>
    </main>
  )
}
