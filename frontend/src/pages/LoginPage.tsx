import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { AuthLayout } from '@/components/AuthLayout'
import { FormAlert } from '@/components/FormAlert'
import { FormField } from '@/components/FormField'
import { PasswordField } from '@/components/PasswordField'
import { SubmitButton } from '@/components/SubmitButton'
import { useSubmit } from '@/components/useSubmit'
import { emailError, onlyErrors } from '@/lib/validation'

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
  const { onSubmit, submitting, error, fieldErrors } = useSubmit(
    () => login(email, password),
    () => onlyErrors({ email: emailError(email), password: password ? undefined : 'Escribe tu contraseña' }),
  )

  return (
    <AuthLayout
      title="Hola de nuevo"
      subtitle="Entra para ver tus listas compartidas"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" state={location.state} className="font-semibold text-primary underline-offset-4 hover:underline">
            Regístrate gratis
          </Link>
        </>
      }
    >
      {/* noValidate: los errores los mostramos nosotros, en español y bajo cada campo */}
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormAlert message={error ?? googleError} />
        <FormField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <PasswordField
          label="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <SubmitButton submitting={submitting} submittingLabel="Entrando…" className="mt-1">
          Entrar
        </SubmitButton>
      </form>
    </AuthLayout>
  )
}
