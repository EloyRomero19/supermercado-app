import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { GoogleButton } from '../components/GoogleButton'
import { useSubmit } from '../components/useSubmit'

export function RegisterPage() {
  const { register } = useAuth()
  const location = useLocation()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { onSubmit, submitting, error, fieldErrors } = useSubmit(() => register({ displayName, email, password }))

  return (
    <AuthLayout
      title="Crear cuenta"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" state={location.state}>
            Inicia sesión
          </Link>
        </>
      }
    >
      {error && <p className="alert" role="alert">{error}</p>}
      <GoogleButton />
      <p className="divider">o con tu email</p>
      <form className="form" onSubmit={onSubmit}>
        <FormField
          label="Nombre"
          autoComplete="name"
          required
          maxLength={100}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={fieldErrors.displayName}
        />
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
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <p className="hint">Mínimo 8 caracteres.</p>
        <button type="submit" className="button button-block" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthLayout>
  )
}
