import { scheduleStatus } from './store'
import { milesPerMonth } from './forecast'
import { serviceLabel } from './serviceTypes'

// Projected due date for a schedule: the earlier of the time-based due date
// and the mileage-based one (miles remaining / driving rate). Overdue items
// land tomorrow so the event is still visible on the calendar.
function projectedDueDate(st, rate) {
  const candidates = []
  if (st.dueDate) {
    const [y, m, d] = st.dueDate.split('-').map(Number)
    candidates.push(new Date(y, m - 1, d))
  }
  if (st.milesLeft != null && rate > 0) {
    const days = (st.milesLeft / rate) * 30.44
    const d = new Date()
    d.setDate(d.getDate() + Math.round(days))
    candidates.push(d)
  }
  if (candidates.length === 0) return null
  let due = new Date(Math.min(...candidates.map((c) => c.getTime())))
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (due < tomorrow) due = tomorrow
  return due
}

const pad = (n) => String(n).padStart(2, '0')
const icsDate = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`

// Escape per RFC 5545: backslash, semicolon, comma, newline.
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

export function buildCalendar(data, horizonMonths = 24) {
  const horizon = new Date()
  horizon.setMonth(horizon.getMonth() + horizonMonths)
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const events = []

  for (const vehicle of data.vehicles) {
    const rate = milesPerMonth(vehicle, data.services)
    const name = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    for (const schedule of data.schedules.filter((s) => s.vehicleId === vehicle.id)) {
      const st = scheduleStatus(schedule, vehicle, data.services)
      const due = projectedDueDate(st, rate)
      if (!due || due > horizon) continue
      const overdue = st.status === 'overdue' ? ' (OVERDUE)' : ''
      const end = new Date(due)
      end.setDate(end.getDate() + 1)
      events.push(
        [
          'BEGIN:VEVENT',
          `UID:carcare-${schedule.id}-${icsDate(due)}@carcare.local`,
          `DTSTAMP:${stamp}`,
          `DTSTART;VALUE=DATE:${icsDate(due)}`,
          `DTEND;VALUE=DATE:${icsDate(end)}`,
          `SUMMARY:${esc(`🔧 ${serviceLabel(schedule.type)} — ${name}${overdue}`)}`,
          `DESCRIPTION:${esc(
            `CarCare reminder. Estimated from your driving rate (~${Math.round(rate)} mi/mo)` +
              (st.dueMileage != null ? ` — due around ${st.dueMileage.toLocaleString()} mi.` : '.') +
              ' Log it in CarCare when done.',
          )}`,
          'BEGIN:VALARM',
          'ACTION:DISPLAY',
          'DESCRIPTION:Maintenance coming up',
          'TRIGGER:-P7D',
          'END:VALARM',
          'END:VEVENT',
        ].join('\r\n'),
      )
    }
  }

  return {
    count: events.length,
    ics: [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CarCare//Maintenance Reminders//EN',
      'CALSCALE:GREGORIAN',
      'X-WR-CALNAME:CarCare Maintenance',
      ...events,
      'END:VCALENDAR',
    ].join('\r\n'),
  }
}

export function downloadCalendar(data) {
  const { count, ics } = buildCalendar(data)
  if (count === 0) return 0
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'carcare-maintenance.ics'
  a.click()
  URL.revokeObjectURL(url)
  return count
}
