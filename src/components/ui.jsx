import { useEffect } from 'react'

export function StatusPill({ status }) {
  const map = {
    overdue: { cls: 'pill-overdue', icon: '✕', label: 'Overdue' },
    due: { cls: 'pill-due', icon: '!', label: 'Due soon' },
    ok: { cls: 'pill-ok', icon: '✓', label: 'OK' },
  }
  const { cls, icon, label } = map[status] ?? map.ok
  return (
    <span className={`pill ${cls}`}>
      <span className="pill-icon" aria-hidden="true">{icon}</span>
      {label}
    </span>
  )
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, body, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  )
}
