import { scheduleStatus, todayStr } from './store'
import { serviceType } from './serviceTypes'

// Average miles driven per month, estimated from the mileage points we have
// (service records + current odometer). Falls back to 1,000 mi/mo.
export function milesPerMonth(vehicle, services) {
  const points = services
    .filter((s) => s.vehicleId === vehicle.id && s.mileage != null)
    .map((s) => ({ date: s.date, miles: s.mileage }))
  points.push({ date: vehicle.createdAt, miles: vehicle.startMileage })
  const earliest = points.reduce((a, b) => (a.date <= b.date ? a : b))
  const months = daysBetweenStr(earliest.date, todayStr()) / 30.44
  const gained = vehicle.currentMileage - earliest.miles
  if (months >= 3 && gained > 0) return gained / months
  return 1000
}

function daysBetweenStr(a, b) {
  const toDate = (s) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return Math.max(0, (toDate(b) - toDate(a)) / 86400000)
}

// Expected cost of one occurrence of a service type: the user's own average
// logged cost if any, otherwise the midpoint of the catalog's typical range.
export function typicalCost(typeId, services) {
  const logged = services.filter((s) => s.type === typeId && s.cost > 0)
  if (logged.length > 0) {
    const avg = logged.reduce((sum, s) => sum + s.cost, 0) / logged.length
    return { value: avg, source: 'history', count: logged.length }
  }
  const est = serviceType(typeId)?.est
  if (est) return { value: (est[0] + est[1]) / 2, range: est, source: 'typical' }
  return null
}

// Project every scheduled item for one vehicle over the horizon, including
// repeats (an oil change can come due twice in 12 months). Returns one line
// per schedule with occurrence count and expected cost.
export function forecastVehicle(vehicle, schedules, services, horizonMonths = 12) {
  const rate = milesPerMonth(vehicle, services)
  const lines = []

  for (const schedule of schedules.filter((s) => s.vehicleId === vehicle.id)) {
    const st = scheduleStatus(schedule, vehicle, services)

    let first = Infinity
    if (st.daysLeft != null) first = st.daysLeft / 30.44
    if (st.milesLeft != null && rate > 0) first = Math.min(first, st.milesLeft / rate)
    if (!Number.isFinite(first)) continue // no interval set
    first = Math.max(first, 0) // overdue counts as due now

    let repeat = Infinity
    if (schedule.intervalMonths) repeat = Number(schedule.intervalMonths)
    if (schedule.intervalMiles && rate > 0) repeat = Math.min(repeat, schedule.intervalMiles / rate)
    repeat = Math.max(repeat, 1)

    if (first > horizonMonths) continue
    const occurrences = Number.isFinite(repeat)
      ? 1 + Math.floor((horizonMonths - first) / repeat)
      : 1
    const cost = typicalCost(schedule.type, services)

    lines.push({
      schedule,
      status: st.status,
      firstMonthsOut: first,
      occurrences,
      cost,
      lineTotal: cost ? cost.value * occurrences : 0,
    })
  }

  lines.sort((a, b) => a.firstMonthsOut - b.firstMonthsOut)
  const total = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  return { rate, lines, total, monthly: total / horizonMonths }
}

export function whenLabel(monthsOut, overdue) {
  if (overdue) return 'now (overdue)'
  if (monthsOut < 0.75) return 'this month'
  const d = new Date()
  d.setMonth(d.getMonth() + Math.round(monthsOut))
  return `~${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
}
