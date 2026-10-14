/** Validaciones de formularios en el navegador (las mismas reglas que comprueba el backend). */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailError(email: string): string | undefined {
  if (!email.trim()) return 'Escribe tu email'
  if (!EMAIL.test(email.trim())) return 'El email no es válido'
}

export function newPasswordError(password: string): string | undefined {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (new TextEncoder().encode(password).length > 72) return 'La contraseña es demasiado larga'
}

/** Quita las claves sin error para que "sin errores" sea un objeto vacío. */
export function onlyErrors(errors: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(errors).filter(([, value]) => value)) as Record<string, string>
}
