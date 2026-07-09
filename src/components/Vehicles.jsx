import { useState } from 'react'
import { Modal, EmptyState } from './ui'
import { fmtMiles } from '../lib/palette'
import { dueItems } from '../lib/store'
import VehicleDetail from './VehicleDetail'

export function vehicleName(v) {
  return v.nickname || `${v.year} ${v.make} ${v.model}`
}

const titleCase = (s) =>
  s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())

function VehicleForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial ?? { nickname: '', year: '', make: '', model: '', currentMileage: '', vin: '', newDriver: false },
  )
  const [vinState, setVinState] = useState('idle') // idle | busy | error | ok
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Free NHTSA vPIC decoder — fills year/make/model from the VIN.
  async function decodeVin() {
    const vin = (form.vin || '').trim()
    if (vin.length < 11) { setVinState('error'); return }
    setVinState('busy')
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
      )
      const json = await res.json()
      const r = json.Results?.[0]
      if (r?.Make && r?.Model) {
        setForm((f) => ({
          ...f,
          year: r.ModelYear || f.year,
          make: titleCase(r.Make),
          model: r.Model,
        }))
        setVinState('ok')
      } else {
        setVinState('error')
      }
    } catch {
      setVinState('error')
    }
  }

  function submit(e) {
    e.preventDefault()
    onSave(form)
    onClose()
  }

  return (
    <Modal title={initial ? 'Edit vehicle' : 'Add vehicle'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label>
          VIN <span className="muted">(optional — fills in the details for you)</span>
          <span className="vin-row">
            <input
              value={form.vin ?? ''}
              onChange={(e) => { set('vin')(e); setVinState('idle') }}
              placeholder="17-character VIN"
              maxLength={17}
              autoCapitalize="characters"
            />
            <button type="button" className="btn" onClick={decodeVin} disabled={vinState === 'busy'}>
              {vinState === 'busy' ? 'Looking up…' : 'Look up'}
            </button>
          </span>
          {vinState === 'ok' && <span className="text-ok">✓ Decoded — check the fields below</span>}
          {vinState === 'error' && (
            <span className="text-overdue">Couldn't decode that VIN — fill in manually.</span>
          )}
        </label>
        <div className="form-row">
          <label>
            Year
            <input type="number" min="1900" max="2100" value={form.year} onChange={set('year')} required />
          </label>
          <label>
            Make
            <input value={form.make} onChange={set('make')} placeholder="Toyota" required />
          </label>
        </div>
        <div className="form-row">
          <label>
            Model
            <input value={form.model} onChange={set('model')} placeholder="Camry" required />
          </label>
          <label>
            Current mileage
            <input type="number" min="0" value={form.currentMileage} onChange={set('currentMileage')} required />
          </label>
        </div>
        <label>
          Nickname <span className="muted">(optional)</span>
          <input value={form.nickname} onChange={set('nickname')} placeholder="The daily driver" />
        </label>
        <label className="check-label check-label-block">
          <input
            type="checkbox"
            checked={Boolean(form.newDriver)}
            onChange={(e) => setForm((f) => ({ ...f, newDriver: e.target.checked }))}
          />
          Newer / less experienced driver
          <span className="muted"> — adds a monthly walk-around check and tighter tire & brake intervals</span>
        </label>
        {!initial && (
          <p className="muted form-note">
            A standard reminder schedule (oil, tires, filters, battery…) is set up automatically — you can
            adjust intervals afterward.
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{initial ? 'Save' : 'Add vehicle'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Vehicles({ data, actions, params, navigate, onLogService }) {
  const [adding, setAdding] = useState(Boolean(params?.adding))
  const selected = data.vehicles.find((v) => v.id === params?.vehicleId)

  if (selected) {
    return (
      <VehicleDetail
        vehicle={selected}
        data={data}
        actions={actions}
        navigate={navigate}
        onLogService={onLogService}
        onBack={() => navigate('vehicles')}
      />
    )
  }

  const due = dueItems(data)

  return (
    <div className="page">
      <div className="page-head">
        <h1>Vehicles</h1>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Add vehicle</button>
      </div>

      {data.vehicles.length === 0 ? (
        <EmptyState
          icon="🔑"
          title="No vehicles yet"
          body="Add a car, truck, or motorcycle to start tracking its maintenance."
          action={<button className="btn btn-primary" onClick={() => setAdding(true)}>Add vehicle</button>}
        />
      ) : (
        <div className="card-grid">
          {data.vehicles.map((v) => {
            const vDue = due.filter((d) => d.vehicle.id === v.id)
            const overdue = vDue.filter((d) => d.status === 'overdue').length
            return (
              <button
                key={v.id}
                className="vehicle-card"
                onClick={() => navigate('vehicles', { vehicleId: v.id })}
              >
                <div className="vehicle-card-name">
                  {vehicleName(v)}
                  {v.newDriver && <span className="driver-tag">New driver</span>}
                </div>
                {v.nickname && <div className="muted">{v.year} {v.make} {v.model}</div>}
                <div className="vehicle-card-miles">{fmtMiles(v.currentMileage)} mi</div>
                <div className="vehicle-card-status">
                  {overdue > 0 ? (
                    <span className="text-overdue">✕ {overdue} overdue</span>
                  ) : vDue.length > 0 ? (
                    <span className="text-due">! {vDue.length} due soon</span>
                  ) : (
                    <span className="text-ok">✓ Up to date</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {adding && <VehicleForm onSave={(f) => actions.addVehicle(f)} onClose={() => setAdding(false)} />}
    </div>
  )
}

export { VehicleForm }
