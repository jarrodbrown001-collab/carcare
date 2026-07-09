import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_SCHEDULE_TYPES, serviceType } from './serviceTypes'

const STORAGE_KEY = 'carcare-data-v1'
const EMPTY = { vehicles: [], services: [], schedules: [], recommendations: [] }

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addMonths(dateStr, months) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1 + months, d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function daysUntil(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target - now) / 86400000)
}

export function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw)
    return { ...EMPTY, ...parsed }
  } catch {
    return EMPTY
  }
}

function defaultSchedulesFor(vehicleId, newDriver = false) {
  const base = DEFAULT_SCHEDULE_TYPES.map((typeId) => {
    const t = serviceType(typeId)
    return {
      id: uid(),
      vehicleId,
      type: typeId,
      intervalMiles: t.miles,
      intervalMonths: t.months,
    }
  })
  if (!newDriver) return base
  // Newer-driver vehicles get tighter tire/brake intervals plus a monthly
  // walk-around and pressure check.
  for (const s of base) {
    if (s.type === 'brake-inspection') s.intervalMonths = 6
    if (s.type === 'tire-rotation') s.intervalMiles = 5000
  }
  base.push({ id: uid(), vehicleId, type: 'safety-check', intervalMiles: null, intervalMonths: 1 })
  base.push({ id: uid(), vehicleId, type: 'tire-pressure', intervalMiles: null, intervalMonths: 1 })
  return base
}

export function useAppData() {
  const [data, setData] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const actions = useMemo(
    () => ({
      addVehicle(fields) {
        const vehicle = {
          id: uid(),
          createdAt: todayStr(),
          startMileage: Number(fields.currentMileage) || 0,
          ...fields,
          currentMileage: Number(fields.currentMileage) || 0,
        }
        setData((d) => ({
          ...d,
          vehicles: [...d.vehicles, vehicle],
          schedules: [...d.schedules, ...defaultSchedulesFor(vehicle.id, Boolean(fields.newDriver))],
        }))
        return vehicle
      },

      // Toggle newer-driver mode on an existing vehicle: on = add the monthly
      // walk-around + pressure check and tighten tire/brake intervals; off =
      // drop the walk-around (other intervals stay as the user has them).
      setNewDriver(vehicleId, enabled) {
        setData((d) => {
          let schedules = d.schedules
          if (enabled) {
            const has = (t) => schedules.some((s) => s.vehicleId === vehicleId && s.type === t)
            const additions = []
            if (!has('safety-check'))
              additions.push({ id: uid(), vehicleId, type: 'safety-check', intervalMiles: null, intervalMonths: 1 })
            if (!has('tire-pressure'))
              additions.push({ id: uid(), vehicleId, type: 'tire-pressure', intervalMiles: null, intervalMonths: 1 })
            schedules = schedules
              .map((s) => {
                if (s.vehicleId !== vehicleId) return s
                if (s.type === 'brake-inspection' && (!s.intervalMonths || s.intervalMonths > 6))
                  return { ...s, intervalMonths: 6 }
                if (s.type === 'tire-rotation' && (!s.intervalMiles || s.intervalMiles > 5000))
                  return { ...s, intervalMiles: 5000 }
                return s
              })
              .concat(additions)
          } else {
            schedules = schedules.filter((s) => !(s.vehicleId === vehicleId && s.type === 'safety-check'))
          }
          return {
            ...d,
            vehicles: d.vehicles.map((v) => (v.id === vehicleId ? { ...v, newDriver: enabled } : v)),
            schedules,
          }
        })
      },

      updateVehicle(id, patch) {
        setData((d) => ({
          ...d,
          vehicles: d.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        }))
      },

      deleteVehicle(id) {
        setData((d) => ({
          vehicles: d.vehicles.filter((v) => v.id !== id),
          services: d.services.filter((s) => s.vehicleId !== id),
          schedules: d.schedules.filter((s) => s.vehicleId !== id),
          recommendations: d.recommendations.filter((r) => r.vehicleId !== id),
        }))
      },

      setMileage(vehicleId, miles) {
        const m = Number(miles)
        if (!Number.isFinite(m) || m < 0) return
        setData((d) => ({
          ...d,
          vehicles: d.vehicles.map((v) =>
            v.id === vehicleId ? { ...v, currentMileage: m } : v,
          ),
        }))
      },

      addService(fields) {
        const service = {
          id: uid(),
          date: todayStr(),
          ...fields,
          mileage: fields.mileage === '' || fields.mileage == null ? null : Number(fields.mileage),
          cost: fields.cost === '' || fields.cost == null ? null : Number(fields.cost),
        }
        setData((d) => {
          const vehicles = d.vehicles.map((v) =>
            v.id === service.vehicleId && service.mileage != null && service.mileage > v.currentMileage
              ? { ...v, currentMileage: service.mileage }
              : v,
          )
          return { ...d, vehicles, services: [...d.services, service] }
        })
        return service
      },

      deleteService(id) {
        setData((d) => ({ ...d, services: d.services.filter((s) => s.id !== id) }))
      },

      addSchedule(fields) {
        setData((d) => ({ ...d, schedules: [...d.schedules, { id: uid(), ...fields }] }))
      },

      updateSchedule(id, patch) {
        setData((d) => ({
          ...d,
          schedules: d.schedules.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }))
      },

      deleteSchedule(id) {
        setData((d) => ({ ...d, schedules: d.schedules.filter((s) => s.id !== id) }))
      },

      // Shop-identified or self-noticed work that isn't on a standard
      // interval — e.g. "replace front lower control arms". Tracked
      // separately from the reminder schedule so cost/timing can be
      // planned for before it's ever logged as done.
      addRecommendation(fields) {
        const rec = {
          id: uid(),
          status: 'open',
          resolvedServiceId: null,
          resolvedDate: null,
          ...fields,
          dateIdentified: fields.dateIdentified || todayStr(),
        }
        setData((d) => ({ ...d, recommendations: [...d.recommendations, rec] }))
        return rec
      },

      updateRecommendation(id, patch) {
        setData((d) => ({
          ...d,
          recommendations: d.recommendations.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }))
      },

      deleteRecommendation(id) {
        setData((d) => ({ ...d, recommendations: d.recommendations.filter((r) => r.id !== id) }))
      },

      importData(json) {
        const parsed = JSON.parse(json)
        if (!parsed || !Array.isArray(parsed.vehicles)) throw new Error('Not a CarCare backup file')
        setData({ ...EMPTY, ...parsed })
      },

      exportData() {
        return JSON.stringify(load(), null, 2)
      },
    }),
    [],
  )

  return { data, actions }
}

// Compute due status for one reminder schedule.
// Baseline is the most recent logged service of that type, or the
// vehicle's starting point if it has never been logged.
export function scheduleStatus(schedule, vehicle, services) {
  const history = services
    .filter((s) => s.vehicleId === vehicle.id && s.type === schedule.type)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const last = history[0] ?? null

  const baseMileage = last?.mileage ?? vehicle.startMileage ?? null
  const baseDate = last?.date ?? vehicle.createdAt

  let dueMileage = null
  let milesLeft = null
  if (schedule.intervalMiles && baseMileage != null) {
    dueMileage = baseMileage + Number(schedule.intervalMiles)
    milesLeft = dueMileage - vehicle.currentMileage
  }

  let dueDate = null
  let daysLeft = null
  if (schedule.intervalMonths && baseDate) {
    dueDate = addMonths(baseDate, Number(schedule.intervalMonths))
    daysLeft = daysUntil(dueDate)
  }

  let status = 'ok'
  if ((milesLeft != null && milesLeft < 0) || (daysLeft != null && daysLeft < 0)) {
    status = 'overdue'
  } else if ((milesLeft != null && milesLeft <= 500) || (daysLeft != null && daysLeft <= 30)) {
    status = 'due'
  }

  return { status, milesLeft, daysLeft, dueMileage, dueDate, last }
}

// All due/overdue items across every vehicle, most urgent first.
export function dueItems(data) {
  const items = []
  for (const vehicle of data.vehicles) {
    for (const schedule of data.schedules.filter((s) => s.vehicleId === vehicle.id)) {
      const st = scheduleStatus(schedule, vehicle, data.services)
      if (st.status !== 'ok') items.push({ vehicle, schedule, ...st })
    }
  }
  const urgency = (it) => {
    const mi = it.milesLeft ?? Infinity
    const days = it.daysLeft != null ? it.daysLeft * 40 : Infinity // ~40 mi/day equivalence
    return Math.min(mi, days)
  }
  return items.sort((a, b) => urgency(a) - urgency(b))
}
