import { dueItems, fmtDate } from '../lib/store'
import { serviceLabel, serviceType } from '../lib/serviceTypes'
import { fmtMoney } from '../lib/palette'
import { downloadCalendar } from '../lib/ics'
import { StatusPill, dueDetail, EmptyState } from './ui'

function vehicleName(v) {
  return v.nickname || `${v.year} ${v.make} ${v.model}`
}

export default function Dashboard({ data, navigate, onLogService }) {
  const { vehicles, services } = data

  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon="🚗"
        title="Welcome to CarCare"
        body="Track maintenance, get reminders before things are overdue, see what you're spending, and learn to do the easy jobs yourself. Start by adding a vehicle."
        action={
          <button className="btn btn-primary" onClick={() => navigate('vehicles', { adding: true })}>
            Add your first vehicle
          </button>
        }
      />
    )
  }

  const due = dueItems(data)
  const overdueCount = due.filter((d) => d.status === 'overdue').length
  const year = new Date().getFullYear()
  const spentThisYear = services
    .filter((s) => s.date.startsWith(String(year)) && s.cost != null)
    .reduce((sum, s) => sum + s.cost, 0)
  const recent = [...services].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5)

  return (
    <div className="page">
      <div className="page-head">
        <h1>Dashboard</h1>
        <div className="head-actions">
          <button
            className="btn"
            title="Download upcoming maintenance as calendar events (.ics) — import into Google Calendar"
            onClick={() => {
              const n = downloadCalendar(data)
              if (n === 0) alert('Nothing to export — no reminders have a projected due date yet.')
            }}
          >
            📅 Add to calendar
          </button>
          <button className="btn btn-primary" onClick={() => onLogService()}>+ Log service</button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-label">Vehicles</div>
          <div className="stat-value">{vehicles.length}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Needs attention</div>
          <div className="stat-value">
            {due.length}
            {overdueCount > 0 && <span className="stat-note stat-note-bad"> {overdueCount} overdue</span>}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Spent in {year}</div>
          <div className="stat-value">{fmtMoney(spentThisYear)}</div>
        </div>
      </div>

      <section>
        <h2>Coming up</h2>
        {due.length === 0 ? (
          <p className="muted">Nothing due — you're all caught up. 🎉</p>
        ) : (
          <ul className="due-list">
            {due.map((item) => {
              const guideId = serviceType(item.schedule.type)?.guideId
              return (
                <li key={item.schedule.id} className="due-row">
                  <StatusPill status={item.status} />
                  <div className="due-main">
                    <span className="due-title">{serviceLabel(item.schedule.type)}</span>
                    <span className="muted">
                      {vehicleName(item.vehicle)} · {dueDetail(item)}
                    </span>
                  </div>
                  <div className="due-actions">
                    {guideId && (
                      <button className="btn btn-small" onClick={() => navigate('guides', { guideId })}>
                        DIY guide
                      </button>
                    )}
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => onLogService(item.vehicle.id, item.schedule.type)}
                    >
                      Done — log it
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2>Recent services</h2>
        {recent.length === 0 ? (
          <p className="muted">No services logged yet. Log past work so reminders start from the right place.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Service</th><th>Vehicle</th><th className="num">Cost</th></tr>
            </thead>
            <tbody>
              {recent.map((s) => {
                const v = vehicles.find((x) => x.id === s.vehicleId)
                return (
                  <tr key={s.id}>
                    <td>{fmtDate(s.date)}</td>
                    <td>{serviceLabel(s.type)}{s.diy && <span className="diy-tag">DIY</span>}</td>
                    <td>{v ? vehicleName(v) : '—'}</td>
                    <td className="num">{s.cost != null ? fmtMoney(s.cost) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
