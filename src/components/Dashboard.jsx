import { useState } from 'react'
import { dueItems, fmtDate } from '../lib/store'
import { serviceLabel, serviceType } from '../lib/serviceTypes'
import { fmtMoney } from '../lib/palette'
import { downloadCalendar } from '../lib/ics'
import { summarize } from '../lib/recommendations'
import { notificationsSupported, notificationsEnabled, enableNotifications, disableNotifications } from '../lib/notify'
import { vehicleName, dueDetail } from '../lib/labels'
import { StatusPill, EmptyState } from './ui'
import ShopDue from './ShopDue'

export default function Dashboard({ data, navigate, onLogService }) {
  const { vehicles, services } = data
  const [shopping, setShopping] = useState(false)
  const [notifyOn, setNotifyOn] = useState(notificationsEnabled())

  async function toggleNotifications() {
    if (notifyOn) {
      disableNotifications()
      setNotifyOn(false)
    } else {
      const ok = await enableNotifications()
      setNotifyOn(ok)
      if (!ok) alert('Notifications are blocked for this site — allow them in your browser settings and try again.')
    }
  }

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
  const recSummary = summarize(data)
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
          {notificationsSupported() && (
            <button
              className="btn"
              title={notifyOn ? 'Notifications on — you get a heads-up when the app opens with items due' : 'Get a notification when the app opens with items due'}
              onClick={toggleNotifications}
            >
              {notifyOn ? '🔔 On' : '🔕 Notify me'}
            </button>
          )}
          {due.length > 0 && (
            <button className="btn" onClick={() => setShopping(true)}>🛒 Shop due items</button>
          )}
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
        {recSummary.count > 0 && (
          <button className="stat-tile stat-tile-btn" onClick={() => navigate('repairs')}>
            <div className="stat-label">Recommended repairs</div>
            <div className="stat-value">{recSummary.count}</div>
            <div className="stat-note muted">{fmtMoney(recSummary.totalCost)} estimated</div>
          </button>
        )}
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
                    {item.schedule.notes && <span className="due-note">📝 {item.schedule.notes}</span>}
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

      {shopping && <ShopDue data={data} onClose={() => setShopping(false)} />}
    </div>
  )
}
