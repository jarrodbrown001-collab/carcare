import { fmtMiles } from './palette'

export function vehicleName(v) {
  return v.nickname || `${v.year} ${v.make} ${v.model}`
}

// "in 1,200 mi" / "in 3 wk" / "800 mi overdue" — whichever bound is tighter.
export function dueDetail({ milesLeft, daysLeft }) {
  const parts = []
  if (milesLeft != null) {
    parts.push(
      milesLeft < 0 ? `${fmtMiles(-milesLeft)} mi overdue` : `in ${fmtMiles(milesLeft)} mi`,
    )
  }
  if (daysLeft != null) {
    const abs = Math.abs(daysLeft)
    const span = abs >= 60 ? `${Math.round(abs / 30)} mo` : abs >= 14 ? `${Math.round(abs / 7)} wk` : `${abs} day${abs === 1 ? '' : 's'}`
    parts.push(daysLeft < 0 ? `${span} overdue` : `in ${span}`)
  }
  if (parts.length === 0) return 'no interval set'
  if (parts.length === 1) return parts[0]
  // Show the more urgent of the two bounds
  const mUrgency = milesLeft
  const dUrgency = daysLeft * 40
  return mUrgency <= dUrgency ? parts[0] : parts[1]
}
