import { useState } from 'react'
import { fmtDate, todayStr } from '../lib/store'
import { fmtMiles, fmtMoneyCents } from '../lib/palette'
import { vehicleFillups, withMpg, fuelStats } from '../lib/fuel'
import { Modal, EmptyState } from './ui'
import { vehicleName } from './Vehicles'

function FillupForm({ vehicles, defaultVehicleId, onSave, onClose }) {
  const initialId = defaultVehicleId ?? vehicles[0]?.id ?? ''
  const initialVehicle = vehicles.find((v) => v.id === initialId)
  const [form, setForm] = useState({
    vehicleId: initialId,
    date: todayStr(),
    mileage: initialVehicle ? String(initialVehicle.currentMileage) : '',
    gallons: '',
    cost: '',
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function selectVehicle(e) {
    const id = e.target.value
    const v = vehicles.find((veh) => veh.id === id)
    setForm((f) => ({ ...f, vehicleId: id, mileage: v ? String(v.currentMileage) : f.mileage }))
  }

  function submit(e) {
    e.preventDefault()
    onSave(form)
    onClose()
  }

  return (
    <Modal title="Log fill-up" onClose={onClose}>
      <form onSubmit={submit} className="form">
        {vehicles.length > 1 && (
          <label>
            Vehicle
            <select value={form.vehicleId} onChange={selectVehicle} required>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{vehicleName(v)}</option>
              ))}
            </select>
          </label>
        )}
        <div className="form-row">
          <label>
            Date
            <input type="date" value={form.date} onChange={set('date')} required />
          </label>
          <label>
            Odometer
            <input type="number" min="0" value={form.mileage} onChange={set('mileage')} required />
          </label>
        </div>
        <div className="form-row">
          <label>
            Gallons
            <input type="number" min="0" step="0.001" placeholder="e.g. 14.2" value={form.gallons} onChange={set('gallons')} required />
          </label>
          <label>
            Total cost ($)
            <input type="number" min="0" step="0.01" placeholder="0.00" value={form.cost} onChange={set('cost')} />
          </label>
        </div>
        <p className="muted form-note">
          Fill the tank completely each time — MPG is computed from the miles driven between full tanks.
        </p>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Fuel({ data, actions }) {
  const [adding, setAdding] = useState(false)
  const { vehicles } = data

  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon="⛽"
        title="No vehicles yet"
        body="Add a vehicle first, then track fill-ups and MPG here."
      />
    )
  }

  const rows = [...data.fillups]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((f) => {
      const series = withMpg(vehicleFillups(data, f.vehicleId))
      const enriched = series.find((s) => s.id === f.id)
      return { ...f, mpg: enriched?.mpg ?? null }
    })

  return (
    <div className="page">
      <div className="page-head">
        <h1>Fuel</h1>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Log fill-up</button>
      </div>

      <div className="stat-row">
        {vehicles.map((v) => {
          const stats = fuelStats(vehicleFillups(data, v.id))
          if (stats.count === 0) return null
          return (
            <div key={v.id} className="stat-tile">
              <div className="stat-label">{vehicleName(v)}</div>
              <div className="stat-value">
                {stats.avgMpg != null ? `${stats.avgMpg.toFixed(1)} mpg` : '—'}
              </div>
              <div className="stat-note muted">
                {stats.lastMpg != null && `last ${stats.lastMpg.toFixed(1)}`}
                {stats.avgPricePerGal != null && ` · avg $${stats.avgPricePerGal.toFixed(2)}/gal`}
              </div>
            </div>
          )
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="⛽"
          title="No fill-ups logged"
          body="Log each full tank (date, odometer, gallons, cost) and MPG trends appear automatically. A dropping MPG is often the first sign something needs attention."
          action={<button className="btn btn-primary" onClick={() => setAdding(true)}>Log first fill-up</button>}
        />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Vehicle</th><th className="num">Odometer</th>
              <th className="num">Gallons</th><th className="num">$/gal</th>
              <th className="num">Cost</th><th className="num">MPG</th><th />
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const v = vehicles.find((x) => x.id === f.vehicleId)
              return (
                <tr key={f.id}>
                  <td>{fmtDate(f.date)}</td>
                  <td>{v ? vehicleName(v) : '—'}</td>
                  <td className="num">{f.mileage != null ? fmtMiles(f.mileage) : '—'}</td>
                  <td className="num">{f.gallons != null ? f.gallons.toFixed(1) : '—'}</td>
                  <td className="num">{f.cost != null && f.gallons > 0 ? `$${(f.cost / f.gallons).toFixed(2)}` : '—'}</td>
                  <td className="num">{f.cost != null ? fmtMoneyCents(f.cost) : '—'}</td>
                  <td className="num">{f.mpg != null ? f.mpg.toFixed(1) : '—'}</td>
                  <td>
                    <button
                      className="btn-icon"
                      aria-label="Delete fill-up"
                      onClick={() => window.confirm('Delete this fill-up?') && actions.deleteFillup(f.id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {adding && (
        <FillupForm
          vehicles={vehicles}
          onSave={(f) => actions.addFillup(f)}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  )
}
