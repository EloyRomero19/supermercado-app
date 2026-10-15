import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { forgotPassword } from '@/api/auth'
import { AuthLayout } from '@/components/AuthLayout'
import { FormAlert } from '@/components/FormAlert'
import { FormField } from '@/components/FormField'
import { SubmitButton } from '@/components/SubmitButton'
import { useSubmit } from '@/components/useSubmit'
import { Button } from '@/components/ui/button'
import { emailError, onlyErrors } from '@/lib/validation'

/** "¿Has olvidado tu contraseña?": pide el email y envía un enlace para elegir otra. */
export function ForgotPasswordPage() {
  const location = useLocation()
  // Si viene del login, ya trae el email escrito
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email ?? '')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const { onSubmit, submitting, error, fieldErrors } = useSubmit(
    async () => {
      await forgotPassword(email.trim())
      setSentTo(email.trim())
    },
    () => onlyErrors({ email: emailError(email) }),
  )

  const footer = (
    <>
      ¿Te has acordado?{' '}
      <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
        Inicia sesión
      </Link>
    </>
  )

  if (sentTo) {
    return (
      <AuthLayout title="Revisa tu correo" subtitle="Te hemos enviado un enlace" footer={footer}>
        <div className="flex flex-col items-center gap-3 text-center" role="status">
          <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary" aria-hidden="true">
            <MailCheck className="size-7" />
          </span>
          {/* Mismo mensaje exista o no la cuenta: así nadie puede averiguar qué emails están registrados */}
          <p className="text-sm leading-relaxed">
            Si hay una cuenta con <span className="font-semibold break-all">{sentTo}</span>, en unos minutos te llegará un
            enlace para elegir una contraseña nueva. Caduca en 1 hora.
          </p>
          <p className="text-sm text-muted-foreground">¿No llega? Mira en la carpeta de spam.</p>
          <Button variant="outline" className="mt-1 h-11 w-full" onClick={() => setSentTo(null)}>
            Probar con otro email
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="¿Has olvidado tu contraseña?" subtitle="Te enviamos un enlace para que elijas otra" footer={footer}>
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormAlert message={error} />
        <FormField
          label="Email de tu cuenta"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <SubmitButton submitting={submitting} submittingLabel="Enviando…" className="mt-1">
          Enviar enlace
        </SubmitButton>
      </form>
    </AuthLayout>
  )
}
