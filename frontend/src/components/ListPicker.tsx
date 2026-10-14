import { useId } from 'react'
import type { ListSummary } from '@/api/types'

type Props = { lists: ListSummary[]; value: string; onChange: (listId: string) => void; label: string }

/** Selector de lista (nativo: en el móvil abre el selector del sistema, cómodo y accesible). */
export function ListPicker({ lists, value, onChange, label }: Props) {
  const id = useId()
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor={id} className="shrink-0 text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 min-w-0 flex-1 truncate rounded-lg border border-input bg-card px-2 font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {lists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.name}
          </option>
        ))}
      </select>
    </div>
  )
}
