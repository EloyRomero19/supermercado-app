import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '@/auth/useAuth'
import { AuthLayout } from '@/components/AuthLayout'
import { FormAlert } from '@/components/FormAlert'
import { PasswordField } from '@/components/PasswordField'
import { SubmitButton } from '@/components/SubmitButton'
import { useSubmit } from '@/components/useSubmit'
import { Button } from '@/components/ui/button'
import { newPasswordError, onlyErrors } from '@/lib/validation'

/**
 * Aquí lleva el enlace del email: /restablecer#<código>. El código va tras "#" (el fragmento),
 * que el navegador nunca envía al servidor; nosotros lo leemos y lo quitamos de la barra de
 * direcciones para que no quede en el historial.
 */
export function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [token] = useState(() => {
    const code = window.location.hash.slice(1)
    if (code) window.history.replaceState(window.history.state, '', window.location.pathname)
    return code
  })
  const [password, setPassword] = useState('')
  const { onSubmit, submitting, error, fieldErrors } = useSubmit(
    async () => {
      await resetPassword(token, password)
      toast.success('Contraseña cambiada. ¡Ya estás dentro!')
      navigate('/', { replace: true })
    },
    () => onlyErrors({ password: newPasswordError(password) }),
  )

  const footer = (
    <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
      Volver a iniciar sesión
    </Link>
  )

  if (!token) {
    return (
      <AuthLayout title="Enlace incompleto" subtitle="Abre el enlace tal cual llegó en el email" footer={footer}>
        <div className="flex flex-col gap-4 text-center">
          <p className="text-sm text-muted-foreground">Si no funciona, pide uno nuevo: los enlaces caducan en 1 hora.</p>
          <Button asChild className="h-11">
            <Link to="/recuperar">Pedir otro enlace</Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Elige una contraseña nueva" subtitle="Al guardarla se cerrará la sesión en tus otros dispositivos" footer={footer}>
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormAlert message={error} />
        {error && (
          <Link to="/recuperar" className="-mt-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Pedir otro enlace
          </Link>
        )}
        <PasswordField
          label="Contraseña nueva"
          autoComplete="new-password"
          maxLength={72}
          hint="Mínimo 8 caracteres."
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <SubmitButton submitting={submitting} submittingLabel="Guardando…" className="mt-1">
          Guardar y entrar
        </SubmitButton>
      </form>
    </AuthLayout>
  )
}
