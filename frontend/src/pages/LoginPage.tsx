import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { AuthLayout } from '../components/AuthLayout'
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
    <AuthLayout
      title="Iniciar sesión"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" state={location.state}>
            Regístrate gratis
          </Link>
        </>
      }
    >
      {(error ?? googleError) && (
        <p className="alert" role="alert">
          {error ?? googleError}
        </p>
      )}
      <GoogleButton />
      <p className="divider">o con tu email</p>
      <form className="form" onSubmit={onSubmit}>
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
        <button type="submit" className="button button-block" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  )
}
