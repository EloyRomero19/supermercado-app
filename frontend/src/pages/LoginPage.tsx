import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { FormField } from '../components/FormField'
import { GoogleButton } from '../components/GoogleButton'
import { useSubmit } from '../components/useSubmit'

// Errores con los que el backend nos devuelve aquí tras el login con Google (?error=...)
const GOOGLE_ERRORS: Record<string, string> = {
  google: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
  'cuenta-existente': 'Ya existe una cuenta con ese email. Entra con tu contraseña.',
}

export function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const googleError = GOOGLE_ERRORS[searchParams.get('error') ?? '']
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Al tener éxito no navegamos aquí: GuestOnly ve la sesión nueva y redirige solo
  const { onSubmit, submitting, error, fieldErrors } = useSubmit(() => login(email, password))

  return (
    <main className="auth-page">
      <h1 className="brand">Lista de la compra</h1>
      <form className="card" onSubmit={onSubmit}>
        <h2>Iniciar sesión</h2>
        {(error ?? googleError) && (
          <p className="alert" role="alert">
            {error ?? googleError}
          </p>
        )}
        <GoogleButton />
        <p className="divider">o con tu email</p>
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <FormField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="muted">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" state={location.state}>
          Regístrate
        </Link>
      </p>
      <p className="muted small">
        <Link to="/privacidad">Privacidad</Link>
      </p>
    </main>
  )
}
