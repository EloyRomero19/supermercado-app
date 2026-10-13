type Props = { done: number; total: number; label?: string }

/** Barra de progreso de la compra: cuántos productos están ya en el carro. */
export function Progress({ done, total, label }: Props) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="progress">
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={label ?? 'Productos en el carro'}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      {label && <span className="progress-label">{label}</span>}
    </div>
  )
}
