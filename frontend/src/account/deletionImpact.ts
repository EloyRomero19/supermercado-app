import type { ListSummary } from '@/api/types'

/** Qué pasará con cada una de mis listas si borro la cuenta (mismas reglas que el backend). */
export type DeletionImpact = {
  /** Solo estoy yo: se borran con todo lo que tienen. */
  deleted: string[]
  /** Compartidas y soy el propietario: las hereda el miembro más antiguo. */
  handedOver: string[]
  /** Compartidas y soy miembro: salgo de ellas. */
  left: string[]
}

export function deletionImpact(lists: ListSummary[]): DeletionImpact {
  const impact: DeletionImpact = { deleted: [], handedOver: [], left: [] }
  for (const list of lists) {
    if (list.memberCount <= 1) impact.deleted.push(list.name)
    else if (list.myRole === 'OWNER') impact.handedOver.push(list.name)
    else impact.left.push(list.name)
  }
  return impact
}
