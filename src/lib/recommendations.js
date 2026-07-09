import { daysUntil } from './store'

// Single value or a low/high range — whichever the user provided.
export function costRange(rec) {
  const lo = rec.estLow, hi = rec.estHigh
  if (lo == null && hi == null) return null
  if (lo != null && hi != null) return { lo, hi, mid: (lo + hi) / 2 }
  const only = lo ?? hi
  return { lo: only, hi: only, mid: only }
}

export function monthsUntilTarget(rec) {
  if (!rec.targetDate) return null
  return Math.max(daysUntil(rec.targetDate) / 30.44, 0)
}

// Suggested monthly set-aside for one item — only computable once it has
// both a cost estimate and a target date.
export function monthlyPlan(rec) {
  const cost = costRange(rec)
  if (!cost) return null
  const months = monthsUntilTarget(rec)
  if (months == null) return null
  return cost.mid / Math.max(months, 1)
}

export function recStatusInfo(rec) {
  if (rec.status === 'done') return { cls: 'pill-ok', icon: '✓', label: 'Done' }
  if (rec.status === 'dismissed') return { cls: 'pill-dismissed', icon: '–', label: 'Dismissed' }
  if (!rec.targetDate) return { cls: 'pill-tracking', icon: '•', label: 'Not scheduled' }
  const days = daysUntil(rec.targetDate)
  if (days < 0) return { cls: 'pill-overdue', icon: '✕', label: 'Past target' }
  if (days <= 30) return { cls: 'pill-due', icon: '!', label: 'Coming up' }
  return { cls: 'pill-tracking', icon: '•', label: 'Planned' }
}

export function openRecommendations(data) {
  return data.recommendations.filter((r) => r.status === 'open')
}

// Totals across a set of open recommendations: how much is identified,
// and how much per month covers the ones with a target date to save by.
export function summarize(data) {
  const open = openRecommendations(data)
  let totalCost = 0
  let costedCount = 0
  let monthlyTotal = 0
  let scheduledCount = 0
  for (const r of open) {
    const cost = costRange(r)
    if (cost) {
      totalCost += cost.mid
      costedCount += 1
    }
    const plan = monthlyPlan(r)
    if (plan != null) {
      monthlyTotal += plan
      scheduledCount += 1
    }
  }
  return { count: open.length, totalCost, costedCount, monthlyTotal, scheduledCount }
}
