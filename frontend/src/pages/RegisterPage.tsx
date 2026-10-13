import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { FormField } from '../components/FormField'
import { useSubmit } from '../components/useSubmit'

export function RegisterPage() {
  const { register } = useAuth()
  const location = useLocation()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { onSubmit, submitting, error, fieldErrors } = useSubmit(() => register({ displayName, email, password }))

  return (
    <main className="auth-page">
      <h1 className="brand">Lista de la compra</h1>
      <form className="card" onSubmit={onSubmit}>
        <h2>Crear cuenta</h2>
        {error && <p className="alert" role="alert">{error}</p>}
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
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="muted">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" state={location.state}>
          Inicia sesión
        </Link>
      </p>
    </main>
  )
}
