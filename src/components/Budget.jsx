import { useState } from 'react'
import { forecastVehicle, whenLabel, typicalCost, milesPerMonth } from '../lib/forecast'
import { scheduleStatus } from '../lib/store'
import { SERVICE_TYPES, serviceLabel } from '../lib/serviceTypes'
import { fmtMoney, fmtMiles } from '../lib/palette'
import { EmptyState, dueDetail } from './ui'
import { vehicleName } from './Vehicles'

function CostSource({ cost }) {
  if (!cost) return <span className="muted">no estimate</span>
  return cost.source === 'history' ? (
    <span className="muted">your avg ({cost.count} logged)</span>
  ) : (
    <span className="muted">typical ${cost.range[0]}–{cost.range[1]}</span>
  )
}

function QuoteCheck({ data }) {
  const [vehicleId, setVehicleId] = useState(data.vehicles[0]?.id ?? '')
  const [rows, setRows] = useState([{ type: 'oil-change', price: '' }])

  const vehicle = data.vehicles.find((v) => v.id === vehicleId)
  const setRow = (i, patch) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  function verdict(row) {
    if (!vehicle) return null
    const schedule = data.schedules.find(
      (s) => s.vehicleId === vehicle.id && s.type === row.type,
    )
    const cost = typicalCost(row.type, data.services)
    const price = row.price === '' ? null : Number(row.price)

    let priceNote = ''
    if (price != null && cost) {
      const high = cost.source === 'typical' ? cost.range[1] : cost.value * 1.25
      if (price > high) priceNote = ` Quoted ${fmtMoney(price)} is above ${cost.source === 'history' ? 'your usual' : 'the typical range'} (${cost.source === 'history' ? fmtMoney(cost.value) : `$${cost.range[0]}–$${cost.range[1]}`}) — worth questioning.`
      else priceNote = ` Price looks in range (${cost.source === 'history' ? `you usually pay ~${fmtMoney(cost.value)}` : `typically $${cost.range[0]}–$${cost.range[1]}`}).`
    }

    if (!schedule) {
      return {
        cls: 'text-due',
        icon: '?',
        text: `You don't track this item, so your log can't confirm it's due. Ask what they observed.${priceNote}`,
      }
    }
    const st = scheduleStatus(schedule, vehicle, data.services)
    if (st.status === 'ok') {
      return {
        cls: 'text-overdue',
        icon: '✕',
        text: `Not due yet — your log says ${dueDetail(st)}${st.last ? ` (last done ${st.last.mileage != null ? `@ ${fmtMiles(st.last.mileage)} mi` : st.last.date})` : ''}. Push back unless they can show why.${priceNote}`,
      }
    }
    return {
      cls: 'text-ok',
      icon: '✓',
      text: `Legitimately ${st.status === 'overdue' ? 'overdue' : 'due'} per your log — fair to approve.${priceNote}`,
    }
  }

  return (
    <section className="chart-card">
      <h2>Quote check <span className="muted">(upsell protection)</span></h2>
      <p className="muted">
        At the shop and they're recommending work? Enter what they quoted — CarCare checks it
        against your actual log.
      </p>
      {data.vehicles.length > 1 && (
        <select
          className="filter-select quote-vehicle"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          aria-label="Vehicle being quoted"
        >
          {data.vehicles.map((v) => (
            <option key={v.id} value={v.id}>{vehicleName(v)}</option>
          ))}
        </select>
      )}
      <ul className="quote-list">
        {rows.map((row, i) => {
          const v = verdict(row)
          return (
            <li key={i} className="quote-row">
              <div className="quote-inputs">
                <select value={row.type} onChange={(e) => setRow(i, { type: e.target.value })}>
                  {SERVICE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Quoted $"
                  value={row.price}
                  onChange={(e) => setRow(i, { price: e.target.value })}
                />
                {rows.length > 1 && (
                  <button
                    className="btn-icon"
                    aria-label="Remove line"
                    onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                  >
                    ✕
                  </button>
                )}
              </div>
              {v && (
                <p className={`quote-verdict ${v.cls}`}>
                  <span aria-hidden="true">{v.icon}</span> {v.text}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      <button
        className="btn btn-small"
        onClick={() => setRows((rs) => [...rs, { type: 'oil-change', price: '' }])}
      >
        + Add quoted item
      </button>
    </section>
  )
}

export default function Budget({ data }) {
  if (data.vehicles.length === 0) {
    return (
      <div className="page">
        <h1>Budget</h1>
        <EmptyState
          icon="💰"
          title="Nothing to forecast yet"
          body="Add a vehicle and CarCare will project the next 12 months of maintenance and suggest a monthly amount to set aside."
        />
      </div>
    )
  }

  const forecasts = data.vehicles.map((v) => ({
    vehicle: v,
    ...forecastVehicle(v, data.schedules, data.services),
  }))
  const grandTotal = forecasts.reduce((s, f) => s + f.total, 0)

  return (
    <div className="page">
      <div className="page-head">
        <h1>Budget</h1>
      </div>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-label">Expected, next 12 months</div>
          <div className="stat-value">{fmtMoney(grandTotal)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Suggested monthly set-aside</div>
          <div className="stat-value">{fmtMoney(grandTotal / 12)}</div>
          <div className="stat-note muted">a sinking fund for car upkeep</div>
        </div>
        {forecasts.map((f) => (
          <div className="stat-tile" key={f.vehicle.id}>
            <div className="stat-label">{vehicleName(f.vehicle)}</div>
            <div className="stat-value">{fmtMoney(f.monthly)}<span className="stat-note muted">/mo</span></div>
          </div>
        ))}
      </div>

      <p className="muted">
        Projections use your reminder intervals, your driving rate, and what you've actually paid
        (falling back to typical shop prices). Repairs can't be predicted — this covers the
        scheduled stuff, so treat it as a floor, not a ceiling.
      </p>

      {forecasts.map(({ vehicle, rate, lines, total }) => (
        <section className="chart-card" key={vehicle.id}>
          <div className="section-head">
            <h2>{vehicleName(vehicle)}</h2>
            <span className="muted">~{fmtMiles(Math.round(rate))} mi/mo</span>
          </div>
          {lines.length === 0 ? (
            <p className="muted">Nothing scheduled comes due in the next 12 months.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th><th>Next</th><th className="num">Times in 12 mo</th>
                  <th className="num">Est. each</th><th className="num">Total</th><th>Basis</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.schedule.id}>
                    <td>{serviceLabel(l.schedule.type)}</td>
                    <td className={l.status === 'overdue' ? 'text-overdue' : ''}>
                      {whenLabel(l.firstMonthsOut, l.status === 'overdue')}
                    </td>
                    <td className="num">{l.occurrences}</td>
                    <td className="num">{l.cost ? fmtMoney(l.cost.value) : '—'}</td>
                    <td className="num">{l.cost ? fmtMoney(l.lineTotal) : '—'}</td>
                    <td><CostSource cost={l.cost} /></td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan="4">12-month total</td>
                  <td className="num">{fmtMoney(total)}</td>
                  <td className="muted">{fmtMoney(total / 12)}/mo</td>
                </tr>
              </tbody>
            </table>
          )}
        </section>
      ))}

      <QuoteCheck data={data} />
    </div>
  )
}
