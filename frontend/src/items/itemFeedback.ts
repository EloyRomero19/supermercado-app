import { ApiError } from '@/api/client'

/** El mensaje que se enseña al usuario cuando falla una petición. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Ha ocurrido un error'
}
