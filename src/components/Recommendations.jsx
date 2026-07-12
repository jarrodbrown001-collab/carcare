import { useState } from 'react'
import { Modal, EmptyState } from './ui'
import { fmtDate, todayStr } from '../lib/store'
import { fmtMoney, fmtMiles } from '../lib/palette'
import { costRange, recStatusInfo, summarize } from '../lib/recommendations'
import { vehicleName } from '../lib/labels'
import ServiceForm from './ServiceForm'

export function RecommendationForm({ vehicles, defaultVehicleId, existing, onSave, onClose }) {
  const [form, setForm] = useState(() =>
    existing
      ? {
          vehicleId: existing.vehicleId,
          title: existing.title,
          source: existing.source ?? '',
          notes: existing.notes ?? '',
          dateIdentified: existing.dateIdentified,
          mileageIdentified: existing.mileageIdentified ?? '',
          estLow: existing.estLow ?? '',
          estHigh: existing.estHigh ?? '',
          targetDate: existing.targetDate ?? '',
        }
      : {
          vehicleId: defaultVehicleId ?? vehicles[0]?.id ?? '',
          title: '',
          source: '',
          notes: '',
          dateIdentified: todayStr(),
          mileageIdentified: '',
          estLow: '',
          estHigh: '',
          targetDate: '',
        },
  )
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    onSave({
      ...form,
      mileageIdentified: form.mileageIdentified === '' ? null : Number(form.mileageIdentified),
      estLow: form.estLow === '' ? null : Number(form.estLow),
      estHigh: form.estHigh === '' ? null : Number(form.estHigh),
      targetDate: form.targetDate || null,
    })
    onClose()
  }

  return (
    <Modal title={existing ? 'Edit recommendation' : 'Add a recommended repair'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        {vehicles.length > 1 && (
          <label>
            Vehicle
            <select value={form.vehicleId} onChange={set('vehicleId')} required>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{vehicleName(v)}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          What was identified?
          <input
            value={form.title}
            onChange={set('title')}
            placeholder="Replace front lower control arms"
            required
          />
        </label>
        <div className="form-row">
          <label>
            Identified by <span className="muted">(optional)</span>
            <input value={form.source} onChange={set('source')} placeholder="Honda Cars of Rockwall" />
          </label>
          <label>
            Date identified
            <input type="date" value={form.dateIdentified} onChange={set('dateIdentified')} required />
          </label>
        </div>
        <div className="form-row">
          <label>
            Est. cost low ($) <span className="muted">(optional)</span>
            <input type="number" min="0" value={form.estLow} onChange={set('estLow')} placeholder="e.g. 400" />
          </label>
          <label>
            Est. cost high ($) <span className="muted">(optional)</span>
            <input type="number" min="0" value={form.estHigh} onChange={set('estHigh')} placeholder="e.g. 600" />
          </label>
        </div>
        <label>
          Target date to do this by <span className="muted">(optional — used to plan monthly savings)</span>
          <input type="date" value={form.targetDate} onChange={set('targetDate')} />
        </label>
        <label>
          Notes <span className="muted">(optional)</span>
          <textarea
            rows="2"
            value={form.notes}
            onChange={set('notes')}
            placeholder="Details, quote info, why it's needed…"
          />
        </label>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{existing ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </Modal>
  )
}

export function RecommendationCard({ rec, vehicle, showVehicle, onEdit, onLog, onDismiss, onRestore, onDelete }) {
  const cost = costRange(rec)
  const info = recStatusInfo(rec)
  return (
    <li className="due-row">
      <span className={`pill ${info.cls}`}>
        <span className="pill-icon" aria-hidden="true">{info.icon}</span>
        {info.label}
      </span>
      <div className="due-main">
        <span className="due-title">{rec.title}</span>
        <span className="muted">
          {showVehicle && vehicle && `${vehicleName(vehicle)} · `}
          {rec.source && `${rec.source} · `}
          identified {fmtDate(rec.dateIdentified)}
          {rec.mileageIdentified != null && ` @ ${fmtMiles(rec.mileageIdentified)} mi`}
          {cost && ` · est. ${cost.lo === cost.hi ? fmtMoney(cost.lo) : `${fmtMoney(cost.lo)}–${fmtMoney(cost.hi)}`}`}
          {rec.targetDate && ` · targeting ${fmtDate(rec.targetDate)}`}
        </span>
        {rec.notes && <span className="muted rec-notes">{rec.notes}</span>}
      </div>
      <div className="due-actions">
        {rec.status === 'open' && onEdit && (
          <button className="btn btn-small" onClick={onEdit}>Edit</button>
        )}
        {rec.status === 'open' && onDismiss && (
          <button className="btn btn-small" onClick={onDismiss}>Dismiss</button>
        )}
        {rec.status === 'open' && onLog && (
          <button className="btn btn-small btn-primary" onClick={onLog}>Done — log it</button>
        )}
        {rec.status !== 'open' && onRestore && (
          <button className="btn btn-small" onClick={onRestore}>Restore</button>
        )}
        {rec.status !== 'open' && onDelete && (
          <button className="btn-icon" aria-label="Delete recommendation" onClick={onDelete}>✕</button>
        )}
      </div>
    </li>
  )
}

export default function Recommendations({ data, actions }) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [logging, setLogging] = useState(null)
  const [showResolved, setShowResolved] = useState(false)
  const [vehicleFilter, setVehicleFilter] = useState('all')

  const { vehicles, recommendations } = data

  if (vehicles.length === 0) {
    return (
      <div className="page">
        <h1>Repairs</h1>
        <EmptyState
          icon="🛠️"
          title="Add a vehicle first"
          body="Once you've added a vehicle, you can track recommended repairs here."
        />
      </div>
    )
  }

  const filtered = recommendations.filter((r) => vehicleFilter === 'all' || r.vehicleId === vehicleFilter)
  const open = filtered
    .filter((r) => r.status === 'open')
    .sort((a, b) => {
      const da = a.targetDate ? new Date(a.targetDate).getTime() : Infinity
      const db = b.targetDate ? new Date(b.targetDate).getTime() : Infinity
      return da - db
    })
  const resolved = filtered.filter((r) => r.status !== 'open')
  const summary = summarize({ ...data, recommendations: filtered })

  function handleLogSave(form) {
    const service = actions.addService(form)
    actions.updateRecommendation(logging.id, {
      status: 'done',
      resolvedServiceId: service.id,
      resolvedDate: service.date,
    })
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Repairs</h1>
        <div className="head-actions">
          {vehicles.length > 1 && (
            <select
              className="filter-select"
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              aria-label="Filter by vehicle"
            >
              <option value="all">All vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{vehicleName(v)}</option>
              ))}
            </select>
          )}
          <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Add recommendation</button>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <EmptyState
          icon="🛠️"
          title="Nothing flagged yet"
          body={'When a shop identifies something outside your routine schedule — "replace front lower control arms," a four-wheel alignment, anything like that — add it here to track the cost and plan when to tackle it.'}
          action={<button className="btn btn-primary" onClick={() => setAdding(true)}>Add a recommendation</button>}
        />
      ) : (
        <>
          <div className="stat-row">
            <div className="stat-tile">
              <div className="stat-label">Open items</div>
              <div className="stat-value">{summary.count}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Total estimated cost</div>
              <div className="stat-value">{fmtMoney(summary.totalCost)}</div>
              {summary.count > summary.costedCount && (
                <div className="stat-note muted">{summary.count - summary.costedCount} without an estimate</div>
              )}
            </div>
            <div className="stat-tile">
              <div className="stat-label">Suggested monthly savings</div>
              <div className="stat-value">{fmtMoney(summary.monthlyTotal)}</div>
              <div className="stat-note muted">
                {summary.scheduledCount > 0
                  ? `based on ${summary.scheduledCount} item${summary.scheduledCount === 1 ? '' : 's'} with a target date`
                  : 'set a target date on an item to plan savings'}
              </div>
            </div>
          </div>

          {open.length === 0 ? (
            <p className="muted">No open recommendations{vehicleFilter !== 'all' ? ' for this vehicle' : ''}.</p>
          ) : (
            <ul className="due-list">
              {open.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  vehicle={vehicles.find((v) => v.id === rec.vehicleId)}
                  showVehicle={vehicleFilter === 'all' && vehicles.length > 1}
                  onEdit={() => setEditing(rec)}
                  onLog={() => setLogging(rec)}
                  onDismiss={() => actions.updateRecommendation(rec.id, { status: 'dismissed' })}
                />
              ))}
            </ul>
          )}

          {resolved.length > 0 && (
            <section>
              <button className="btn btn-small" onClick={() => setShowResolved((s) => !s)}>
                {showResolved ? 'Hide' : 'Show'} done/dismissed ({resolved.length})
              </button>
              {showResolved && (
                <ul className="due-list" style={{ marginTop: 10 }}>
                  {resolved.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      rec={rec}
                      vehicle={vehicles.find((v) => v.id === rec.vehicleId)}
                      showVehicle={vehicles.length > 1}
                      onRestore={() => actions.updateRecommendation(rec.id, { status: 'open' })}
                      onDelete={() => window.confirm('Delete this recommendation?') && actions.deleteRecommendation(rec.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      {adding && (
        <RecommendationForm
          vehicles={vehicles}
          defaultVehicleId={vehicleFilter !== 'all' ? vehicleFilter : undefined}
          onSave={(f) => actions.addRecommendation(f)}
          onClose={() => setAdding(false)}
        />
      )}
      {editing && (
        <RecommendationForm
          vehicles={vehicles}
          existing={editing}
          onSave={(f) => actions.updateRecommendation(editing.id, f)}
          onClose={() => setEditing(null)}
        />
      )}
      {logging && (
        <ServiceForm
          vehicles={vehicles}
          defaultVehicleId={logging.vehicleId}
          defaultType="repair"
          defaultNotes={[logging.title, logging.source].filter(Boolean).join(' — ')}
          defaultCost={costRange(logging) ? Math.round(costRange(logging).mid) : ''}
          onSave={handleLogSave}
          onClose={() => setLogging(null)}
        />
      )}
    </div>
  )
}
