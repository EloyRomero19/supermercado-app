import { useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'

type FieldErrors = Record<string, string>

/**
 * Gestiona el envío de un formulario: estado "enviando" y errores generales y por campo.
 * validate (opcional) comprueba los campos en el navegador antes de llamar al backend, para
 * avisar al momento; el backend vuelve a validarlo todo igualmente.
 */
export function useSubmit(action: () => Promise<void>, validate?: () => FieldErrors) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const clientErrors = validate?.() ?? {}
    setFieldErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) return

    setSubmitting(true)
    try {
      await action()
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
        setFieldErrors(e.fieldErrors)
      } else {
        setError('Ha ocurrido un error inesperado')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { onSubmit, submitting, error, fieldErrors }
}
