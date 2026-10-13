import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Panel modal: en el móvil sube desde abajo ("bottom sheet"), en pantallas grandes sale centrado.
 * Usa el <dialog> nativo: el navegador ya gestiona el foco, la tecla Escape y el fondo oscuro.
 */
export function Sheet({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onClose={onClose}
      // Un clic fuera del contenido (en el fondo) cierra el panel
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="sheet-body">
        <div className="sheet-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
