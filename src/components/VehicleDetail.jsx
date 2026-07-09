import { useState } from 'react'
import { scheduleStatus, fmtDate } from '../lib/store'
import { SERVICE_TYPES, serviceLabel, serviceType } from '../lib/serviceTypes'
import { fmtMiles, fmtMoneyCents } from '../lib/palette'
import { costRange } from '../lib/recommendations'
import { StatusPill, dueDetail, Modal } from './ui'
import { vehicleName, VehicleForm } from './Vehicles'
import { RecommendationCard, RecommendationForm } from './Recommendations'
import ServiceForm from './ServiceForm'

function ScheduleForm({ vehicleId, existing, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(
    existing ?? { type: 'oil-change', intervalMiles: '', intervalMonths: '' },
  )
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function pickType(e) {
    const t = serviceType(e.target.value)
    setForm((f) => ({
      ...f,
      type: e.target.value,
      intervalMiles: f.intervalMiles || t?.miles || '',
      intervalMonths: f.intervalMonths || t?.months || '',
    }))
  }

  function submit(e) {
    e.preventDefault()
    onSave({
      vehicleId,
      type: form.type,
      intervalMiles: form.intervalMiles === '' ? null : Number(form.intervalMiles),
      intervalMonths: form.intervalMonths === '' ? null : Number(form.intervalMonths),
    })
    onClose()
  }

  return (
    <Modal title={existing ? 'Edit reminder' : 'Add reminder'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label>
          Service
          <select value={form.type} onChange={pickType} disabled={Boolean(existing)}>
            {SERVICE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            Every X miles
            <input type="number" min="0" placeholder="—" value={form.intervalMiles ?? ''} onChange={set('intervalMiles')} />
          </label>
          <label>
            Every X months
            <input type="number" min="0" placeholder="—" value={form.intervalMonths ?? ''} onChange={set('intervalMonths')} />
          </label>
        </div>
        <p className="muted form-note">Whichever comes first triggers the reminder. Leave one blank to use only the other.</p>
        <div className="form-actions">
          {existing && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => { onDelete(existing.id); onClose() }}
            >
              Remove reminder
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  )
}

export default function VehicleDetail({ vehicle, data, actions, navigate, onLogService, onBack }) {
  const [mileageInput, setMileageInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [scheduleModal, setScheduleModal] = useState(null) // 'new' | schedule object
  const [recModal, setRecModal] = useState(null) // 'new' | recommendation object
  const [loggingRec, setLoggingRec] = useState(null)
  const [showResolvedRecs, setShowResolvedRecs] = useState(false)

  const vehicleRecs = data.recommendations.filter((r) => r.vehicleId === vehicle.id)
  const openRecs = [...vehicleRecs.filter((r) => r.status === 'open')].sort((a, b) => {
    const da = a.targetDate ? new Date(a.targetDate).getTime() : Infinity
    const db = b.targetDate ? new Date(b.targetDate).getTime() : Infinity
    return da - db
  })
  const resolvedRecs = vehicleRecs.filter((r) => r.status !== 'open')

  const schedules = data.schedules
    .filter((s) => s.vehicleId === vehicle.id)
    .map((s) => ({ schedule: s, ...scheduleStatus(s, vehicle, data.services) }))
    .sort((a, b) => {
      const rank = { overdue: 0, due: 1, ok: 2 }
      return rank[a.status] - rank[b.status]
    })

  const history = data.services
    .filter((s) => s.vehicleId === vehicle.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  function updateMileage(e) {
    e.preventDefault()
    if (mileageInput !== '') {
      actions.setMileage(vehicle.id, mileageInput)
      setMileageInput('')
    }
  }

  function removeVehicle() {
    if (window.confirm(`Delete ${vehicleName(vehicle)} and all of its history? This can't be undone.`)) {
      actions.deleteVehicle(vehicle.id)
      onBack()
    }
  }

  return (
    <div className="page">
      <button className="btn btn-small" onClick={onBack}>← All vehicles</button>

      <div className="page-head">
        <div>
          <h1>
            {vehicleName(vehicle)}
            {vehicle.newDriver && <span className="driver-tag">New driver</span>}
          </h1>
          {vehicle.nickname && <p className="muted">{vehicle.year} {vehicle.make} {vehicle.model}</p>}
        </div>
        <div className="head-actions">
          <button className="btn" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn btn-danger" onClick={removeVehicle}>Delete</button>
        </div>
      </div>

      <form className="mileage-bar" onSubmit={updateMileage}>
        <span className="mileage-current">{fmtMiles(vehicle.currentMileage)} mi</span>
        <input
          type="number"
          min={0}
          placeholder="Update odometer…"
          value={mileageInput}
          onChange={(e) => setMileageInput(e.target.value)}
        />
        <button type="submit" className="btn btn-small">Update</button>
      </form>

      <section>
        <div className="section-head">
          <h2>Maintenance schedule</h2>
          <button className="btn btn-small" onClick={() => setScheduleModal('new')}>+ Add reminder</button>
        </div>
        <ul className="due-list">
          {schedules.map((item) => {
            const guideId = serviceType(item.schedule.type)?.guideId
            return (
              <li key={item.schedule.id} className="due-row">
                <StatusPill status={item.status} />
                <div className="due-main">
                  <span className="due-title">{serviceLabel(item.schedule.type)}</span>
                  <span className="muted">
                    {dueDetail(item)}
                    {item.last
                      ? ` · last: ${fmtDate(item.last.date)}${item.last.mileage != null ? ` @ ${fmtMiles(item.last.mileage)} mi` : ''}`
                      : ' · never logged'}
                  </span>
                </div>
                <div className="due-actions">
                  {guideId && (
                    <button className="btn btn-small" onClick={() => navigate('guides', { guideId })}>
                      DIY guide
                    </button>
                  )}
                  <button className="btn btn-small" onClick={() => setScheduleModal(item.schedule)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-small btn-primary"
                    onClick={() => onLogService(vehicle.id, item.schedule.type)}
                  >
                    Log
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <div className="section-head">
          <h2>Recommended repairs</h2>
          <button className="btn btn-small" onClick={() => setRecModal('new')}>+ Add recommendation</button>
        </div>
        {openRecs.length === 0 ? (
          <p className="muted">
            Nothing flagged. When a shop identifies work outside the routine schedule, add it here to track cost
            and plan when to do it.
          </p>
        ) : (
          <ul className="due-list">
            {openRecs.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                showVehicle={false}
                onEdit={() => setRecModal(rec)}
                onLog={() => setLoggingRec(rec)}
                onDismiss={() => actions.updateRecommendation(rec.id, { status: 'dismissed' })}
              />
            ))}
          </ul>
        )}
        {resolvedRecs.length > 0 && (
          <>
            <button
              className="btn btn-small"
              style={{ marginTop: 8 }}
              onClick={() => setShowResolvedRecs((s) => !s)}
            >
              {showResolvedRecs ? 'Hide' : 'Show'} done/dismissed ({resolvedRecs.length})
            </button>
            {showResolvedRecs && (
              <ul className="due-list" style={{ marginTop: 8 }}>
                {resolvedRecs.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    showVehicle={false}
                    onRestore={() => actions.updateRecommendation(rec.id, { status: 'open' })}
                    onDelete={() => window.confirm('Delete this recommendation?') && actions.deleteRecommendation(rec.id)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section>
        <div className="section-head">
          <h2>Service history</h2>
          <button className="btn btn-small btn-primary" onClick={() => onLogService(vehicle.id)}>+ Log service</button>
        </div>
        {history.length === 0 ? (
          <p className="muted">
            Nothing logged yet. Add past services (even rough dates) so reminders count from the right baseline.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Service</th><th className="num">Mileage</th><th className="num">Cost</th><th>Notes</th><th /></tr>
            </thead>
            <tbody>
              {history.map((s) => (
                <tr key={s.id}>
                  <td>{fmtDate(s.date)}</td>
                  <td>{serviceLabel(s.type)}{s.diy && <span className="diy-tag">DIY</span>}</td>
                  <td className="num">{s.mileage != null ? fmtMiles(s.mileage) : '—'}</td>
                  <td className="num">{s.cost != null ? fmtMoneyCents(s.cost) : '—'}</td>
                  <td className="notes-cell">{s.notes}</td>
                  <td>
                    <button
                      className="btn-icon"
                      aria-label="Delete record"
                      onClick={() => window.confirm('Delete this service record?') && actions.deleteService(s.id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {editing && (
        <VehicleForm
          initial={{
            nickname: vehicle.nickname ?? '',
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            currentMileage: vehicle.currentMileage,
            vin: vehicle.vin ?? '',
            newDriver: Boolean(vehicle.newDriver),
          }}
          onSave={(f) => {
            const { newDriver, ...rest } = f
            actions.updateVehicle(vehicle.id, { ...rest, currentMileage: Number(f.currentMileage) || 0 })
            if (Boolean(newDriver) !== Boolean(vehicle.newDriver)) {
              actions.setNewDriver(vehicle.id, Boolean(newDriver))
            }
          }}
          onClose={() => setEditing(false)}
        />
      )}

      {scheduleModal === 'new' && (
        <ScheduleForm
          vehicleId={vehicle.id}
          onSave={(f) => actions.addSchedule(f)}
          onClose={() => setScheduleModal(null)}
        />
      )}
      {scheduleModal && scheduleModal !== 'new' && (
        <ScheduleForm
          vehicleId={vehicle.id}
          existing={scheduleModal}
          onSave={(f) => actions.updateSchedule(scheduleModal.id, f)}
          onDelete={(id) => actions.deleteSchedule(id)}
          onClose={() => setScheduleModal(null)}
        />
      )}

      {recModal === 'new' && (
        <RecommendationForm
          vehicles={[vehicle]}
          defaultVehicleId={vehicle.id}
          onSave={(f) => actions.addRecommendation(f)}
          onClose={() => setRecModal(null)}
        />
      )}
      {recModal && recModal !== 'new' && (
        <RecommendationForm
          vehicles={[vehicle]}
          existing={recModal}
          onSave={(f) => actions.updateRecommendation(recModal.id, f)}
          onClose={() => setRecModal(null)}
        />
      )}
      {loggingRec && (
        <ServiceForm
          vehicles={[vehicle]}
          defaultVehicleId={vehicle.id}
          defaultType="repair"
          defaultNotes={[loggingRec.title, loggingRec.source].filter(Boolean).join(' — ')}
          defaultCost={costRange(loggingRec) ? Math.round(costRange(loggingRec).mid) : ''}
          onSave={(form) => {
            const service = actions.addService(form)
            actions.updateRecommendation(loggingRec.id, {
              status: 'done',
              resolvedServiceId: service.id,
              resolvedDate: service.date,
            })
          }}
          onClose={() => setLoggingRec(null)}
        />
      )}
    </div>
  )
}
