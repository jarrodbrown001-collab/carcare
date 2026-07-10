import { useState } from 'react'
import { Modal } from './ui'
import { SERVICE_TYPES } from '../lib/serviceTypes'
import { todayStr } from '../lib/store'

export default function ServiceForm({
  vehicles,
  defaultVehicleId,
  defaultType,
  defaultNotes,
  defaultCost,
  onSave,
  onClose,
}) {
  const initialVehicleId = defaultVehicleId ?? vehicles[0]?.id ?? ''
  const initialVehicle = vehicles.find((v) => v.id === initialVehicleId)
  const [form, setForm] = useState({
    vehicleId: initialVehicleId,
    type: defaultType ?? 'oil-change',
    date: todayStr(),
    mileage: initialVehicle ? String(initialVehicle.currentMileage) : '',
    cost: defaultCost != null && defaultCost !== '' ? String(defaultCost) : '',
    diy: false,
    notes: defaultNotes ?? '',
    partsUsed: '',
    by: '',
  })

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  function selectVehicle(e) {
    const id = e.target.value
    const v = vehicles.find((veh) => veh.id === id)
    setForm((f) => ({ ...f, vehicleId: id, mileage: v ? String(v.currentMileage) : f.mileage }))
  }

  const vehicle = vehicles.find((v) => v.id === form.vehicleId)

  function submit(e) {
    e.preventDefault()
    onSave(form)
    onClose()
  }

  return (
    <Modal title="Log service" onClose={onClose}>
      <form onSubmit={submit} className="form">
        {vehicles.length > 1 && (
          <label>
            Vehicle
            <select value={form.vehicleId} onChange={selectVehicle} required>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.nickname || `${v.year} ${v.make} ${v.model}`}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          Service
          <select value={form.type} onChange={set('type')} required>
            {SERVICE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            Date
            <input type="date" value={form.date} onChange={set('date')} required />
          </label>
          <label>
            Mileage
            <input
              type="number"
              min="0"
              placeholder={vehicle ? String(vehicle.currentMileage) : ''}
              value={form.mileage}
              onChange={set('mileage')}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Cost ($)
            <input type="number" min="0" step="0.01" placeholder="0.00" value={form.cost} onChange={set('cost')} />
          </label>
          <label className="check-label">
            <input type="checkbox" checked={form.diy} onChange={set('diy')} />
            I did it myself
          </label>
        </div>
        <label>
          Notes
          <textarea rows="2" placeholder="Brand, shop, part numbers…" value={form.notes} onChange={set('notes')} />
        </label>
        <div className="form-row">
          <label>
            Parts used <span className="muted">(optional)</span>
            <input
              placeholder="e.g. 90915-YZZD4 filter + 7qt Mobil 1 — $54"
              value={form.partsUsed}
              onChange={set('partsUsed')}
            />
          </label>
          <label>
            Logged by <span className="muted">(optional)</span>
            <input placeholder="e.g. Jarrod" value={form.by} onChange={set('by')} />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  )
}
