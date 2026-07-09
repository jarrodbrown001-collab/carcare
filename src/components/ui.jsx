import { useEffect } from 'react'
import { fmtMiles } from '../lib/palette'

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

// "in 1,200 mi" / "in 3 wk" / "800 mi overdue" — whichever bound is tighter.
export function dueDetail({ milesLeft, daysLeft }) {
  const parts = []
  if (milesLeft != null) {
    parts.push(
      milesLeft < 0 ? `${fmtMiles(-milesLeft)} mi overdue` : `in ${fmtMiles(milesLeft)} mi`,
    )
  }
  if (daysLeft != null) {
    const abs = Math.abs(daysLeft)
    const span = abs >= 60 ? `${Math.round(abs / 30)} mo` : abs >= 14 ? `${Math.round(abs / 7)} wk` : `${abs} day${abs === 1 ? '' : 's'}`
    parts.push(daysLeft < 0 ? `${span} overdue` : `in ${span}`)
  }
  if (parts.length === 0) return 'no interval set'
  if (parts.length === 1) return parts[0]
  // Show the more urgent of the two bounds
  const mUrgency = milesLeft
  const dUrgency = daysLeft * 40
  return mUrgency <= dUrgency ? parts[0] : parts[1]
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
