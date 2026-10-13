import { useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'

/** Gestiona el envío de un formulario: estado "enviando" y errores generales y por campo. */
export function useSubmit(action: () => Promise<void>) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setFieldErrors({})
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
