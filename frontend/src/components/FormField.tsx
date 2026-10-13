import { useId, type InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

/** Input con su etiqueta y el error del backend debajo, enlazados para lectores de pantalla. */
export function FormField({ label, error, ...inputProps }: Props) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} {...inputProps} />
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
