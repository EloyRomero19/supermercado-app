import { describe, expect, it } from 'vitest'
import { extractInviteCode } from './invite'

describe('extractInviteCode', () => {
  it('acepta el enlace completo, venga del dominio que venga', () => {
    expect(extractInviteCode('https://milista.es/unirse/K7MX4QPA')).toBe('K7MX4QPA')
    expect(extractInviteCode('  http://localhost:5173/unirse/K7MX4QPA/ ')).toBe('K7MX4QPA')
    expect(extractInviteCode('https://milista.es/unirse/K7MX4QPA?utm_source=whatsapp')).toBe('K7MX4QPA')
  })

  it('acepta solo el código, con o sin guion', () => {
    expect(extractInviteCode('K7MX4QPA')).toBe('K7MX4QPA')
    expect(extractInviteCode('k7mx-4qpa')).toBe('k7mx-4qpa')
  })

  it('rechaza lo que no es una invitación', () => {
    expect(extractInviteCode('https://milista.es/listas/123')).toBeNull()
    expect(extractInviteCode('hola, ¿vienes?')).toBeNull()
    expect(extractInviteCode('')).toBeNull()
  })
})
