import { describe, expect, it } from 'vitest'
import type { ListSummary } from '@/api/types'
import { deletionImpact } from './deletionImpact'

const list = (name: string, myRole: ListSummary['myRole'], memberCount: number): ListSummary => ({
  id: name,
  name,
  myRole,
  memberCount,
  itemCount: 0,
  checkedCount: 0,
})

describe('deletionImpact', () => {
  it('reparte las listas según si hay alguien más y mi rol', () => {
    const impact = deletionImpact([
      list('Solo mía', 'OWNER', 1),
      list('Casa', 'OWNER', 3),
      list('Piso', 'MEMBER', 2),
      list('Trabajo', 'OWNER', 1),
    ])

    expect(impact).toEqual({ deleted: ['Solo mía', 'Trabajo'], handedOver: ['Casa'], left: ['Piso'] })
  })

  it('sin listas no pasa nada con ninguna', () => {
    expect(deletionImpact([])).toEqual({ deleted: [], handedOver: [], left: [] })
  })
})
