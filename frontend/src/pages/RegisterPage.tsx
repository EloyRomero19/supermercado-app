import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { AuthLayout } from '@/components/AuthLayout'
import { FormAlert } from '@/components/FormAlert'
import { FormField } from '@/components/FormField'
import { PasswordField } from '@/components/PasswordField'
import { SubmitButton } from '@/components/SubmitButton'
import { useSubmit } from '@/components/useSubmit'
import { emailError, newPasswordError, onlyErrors } from '@/lib/validation'

export function RegisterPage() {
  const { register } = useAuth()
  const location = useLocation()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { onSubmit, submitting, error, fieldErrors } = useSubmit(
    () => register({ displayName, email, password }),
    () =>
      onlyErrors({
        displayName: displayName.trim() ? undefined : 'Escribe tu nombre',
        email: emailError(email),
        password: newPasswordError(password),
      }),
  )

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Comparte listas con tu familia o tus compañeros de piso"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-primary underline-offset-4 hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormAlert message={error} />
        <FormField
          label="Nombre"
          autoComplete="name"
          placeholder="Cómo te verán los demás"
          maxLength={100}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={fieldErrors.displayName}
        />
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
          autoComplete="new-password"
          maxLength={72}
          hint="Mínimo 8 caracteres."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <SubmitButton submitting={submitting} submittingLabel="Creando cuenta…" className="mt-1">
          Crear cuenta
        </SubmitButton>
      </form>
    </AuthLayout>
  )
}
