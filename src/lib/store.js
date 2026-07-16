import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_SCHEDULE_TYPES, serviceType } from './serviceTypes'
import { supabase, cloudEnabled } from './supabaseClient'

const STORAGE_KEY = 'carcare-data-v1'
const PRE_CLOUD_BACKUP_KEY = 'carcare-pre-cloud-backup'
const LAST_BACKUP_KEY = 'carcare-last-backup'
const EMPTY = { vehicles: [], services: [], schedules: [], recommendations: [], fillups: [] }
const TABLES = ['vehicles', 'services', 'schedules', 'recommendations', 'fillups']

// Snapshot any pre-existing local backup into a protected key, once, at
// module load — before React or cloud sync ever gets a chance to touch
// `carcare-data-v1`. The migration prompt (App.jsx) and migrateLocalData()
// read from this frozen snapshot instead, so a first cloud fetch (which
// starts empty and gets persisted back to STORAGE_KEY once loaded) can never
// race the migration check into seeing an already-overwritten local backup.
try {
  if (!localStorage.getItem(PRE_CLOUD_BACKUP_KEY)) {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) localStorage.setItem(PRE_CLOUD_BACKUP_KEY, existing)
  }
} catch {
  // storage unavailable (e.g. private browsing) — nothing to protect
}

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

function loadPreCloudBackup() {
  try {
    const raw = localStorage.getItem(PRE_CLOUD_BACKUP_KEY)
    if (!raw) return EMPTY
    return { ...EMPTY, ...JSON.parse(raw) }
  } catch {
    return EMPTY
  }
}

// ---------- Supabase row <-> app-shape transforms ----------

const toVehicleRow = (v, userId) => ({
  id: v.id,
  user_id: userId,
  nickname: v.nickname || null,
  year: v.year ?? null,
  make: v.make || null,
  model: v.model || null,
  vin: v.vin || null,
  current_mileage: v.currentMileage ?? null,
  start_mileage: v.startMileage ?? null,
  mileage_updated_at: v.mileageUpdatedAt || null,
  new_driver: Boolean(v.newDriver),
  notes: v.notes || null,
  created_at: v.createdAt || null,
})
const fromVehicleRow = (r) => ({
  id: r.id,
  nickname: r.nickname ?? '',
  year: r.year ?? '',
  make: r.make ?? '',
  model: r.model ?? '',
  vin: r.vin ?? '',
  currentMileage: r.current_mileage ?? 0,
  startMileage: r.start_mileage ?? 0,
  mileageUpdatedAt: r.mileage_updated_at ?? null,
  newDriver: Boolean(r.new_driver),
  notes: r.notes ?? '',
  createdAt: r.created_at ?? '',
})

const toServiceRow = (s, userId) => ({
  id: s.id,
  user_id: userId,
  vehicle_id: s.vehicleId,
  type: s.type || null,
  date: s.date || null,
  mileage: s.mileage ?? null,
  cost: s.cost ?? null,
  diy: Boolean(s.diy),
  notes: s.notes || null,
  parts_used: s.partsUsed || null,
  by: s.by || null,
})
const fromServiceRow = (r) => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  type: r.type,
  date: r.date,
  mileage: r.mileage,
  cost: r.cost,
  diy: Boolean(r.diy),
  notes: r.notes ?? '',
  partsUsed: r.parts_used ?? '',
  by: r.by ?? '',
})

const toScheduleRow = (s, userId) => ({
  id: s.id,
  user_id: userId,
  vehicle_id: s.vehicleId,
  type: s.type,
  interval_miles: s.intervalMiles ?? null,
  interval_months: s.intervalMonths ?? null,
  notes: s.notes || null,
})
const fromScheduleRow = (r) => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  type: r.type,
  intervalMiles: r.interval_miles,
  intervalMonths: r.interval_months,
  notes: r.notes ?? '',
})

const toRecRow = (rec, userId) => ({
  id: rec.id,
  user_id: userId,
  vehicle_id: rec.vehicleId,
  title: rec.title || null,
  source: rec.source || null,
  notes: rec.notes || null,
  date_identified: rec.dateIdentified || null,
  mileage_identified: rec.mileageIdentified ?? null,
  est_low: rec.estLow ?? null,
  est_high: rec.estHigh ?? null,
  target_date: rec.targetDate || null,
  status: rec.status || 'open',
  resolved_service_id: rec.resolvedServiceId || null,
  resolved_date: rec.resolvedDate || null,
})
const fromRecRow = (r) => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  title: r.title ?? '',
  source: r.source ?? '',
  notes: r.notes ?? '',
  dateIdentified: r.date_identified,
  mileageIdentified: r.mileage_identified,
  estLow: r.est_low,
  estHigh: r.est_high,
  targetDate: r.target_date,
  status: r.status ?? 'open',
  resolvedServiceId: r.resolved_service_id,
  resolvedDate: r.resolved_date,
})

const toFillupRow = (f, userId) => ({
  id: f.id,
  user_id: userId,
  vehicle_id: f.vehicleId,
  date: f.date || null,
  mileage: f.mileage ?? null,
  gallons: f.gallons ?? null,
  cost: f.cost ?? null,
})
const fromFillupRow = (r) => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  date: r.date,
  mileage: r.mileage,
  gallons: r.gallons,
  cost: r.cost,
})

const ROW_MAP = {
  vehicles: { toRow: toVehicleRow, fromRow: fromVehicleRow },
  services: { toRow: toServiceRow, fromRow: fromServiceRow },
  schedules: { toRow: toScheduleRow, fromRow: fromScheduleRow },
  recommendations: { toRow: toRecRow, fromRow: fromRecRow },
  fillups: { toRow: toFillupRow, fromRow: fromFillupRow },
}

function syncFail(err) {
  console.error('CarCare cloud sync failed:', err)
  alert(`Couldn't sync to the cloud (${err.message}). Your change is saved on this device — try again once you're back online.`)
}

// Fire a Supabase write without blocking the UI; surface failures loudly
// since a silently-dropped write means this device and the cloud disagree.
function fireAndAlert(promise) {
  promise.then(({ error }) => {
    if (error) syncFail(error)
  })
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

export function useAppData(user) {
  const cloud = cloudEnabled && Boolean(user)
  const [data, setDataState] = useState(() => (cloud ? EMPTY : load()))
  const [loaded, setLoaded] = useState(!cloud)
  const dataRef = useRef(data)

  function commit(updater) {
    const next = typeof updater === 'function' ? updater(dataRef.current) : updater
    dataRef.current = next
    setDataState(next)
    return next
  }

  // Local cache — instant reload even offline, and a fallback if cloud sync
  // is ever unavailable. Not authoritative once signed in; Supabase is.
  //
  // Guarded on `cloud && !loaded`: right after sign-in, `data` briefly holds
  // an empty placeholder while the cloud fetch is in flight. Persisting that
  // would overwrite a real pre-existing local backup with nothing before the
  // migration prompt (see App.jsx) ever gets a chance to see it.
  useEffect(() => {
    if (cloud && !loaded) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data, cloud, loaded])

  // Initial cloud fetch + realtime subscription so other signed-in devices'
  // edits show up here live.
  useEffect(() => {
    if (!cloud) return
    let cancelled = false
    setLoaded(false)

    async function fetchAll() {
      const results = await Promise.all(
        TABLES.map((table) => supabase.from(table).select('*').eq('user_id', user.id)),
      )
      const failed = results.find((r) => r.error)
      if (failed?.error) {
        if (!cancelled) syncFail(failed.error)
        return
      }
      if (cancelled) return
      const next = { ...EMPTY }
      TABLES.forEach((table, i) => {
        next[table] = results[i].data.map(ROW_MAP[table].fromRow)
      })
      commit(next)
      setLoaded(true)
    }
    fetchAll()

    const channel = supabase.channel(`carcare-sync-${user.id}`)
    for (const table of TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` },
        (payload) => {
          const { fromRow } = ROW_MAP[table]
          commit((prev) => {
            const list = prev[table]
            if (payload.eventType === 'DELETE') {
              return { ...prev, [table]: list.filter((x) => x.id !== payload.old.id) }
            }
            const item = fromRow(payload.new)
            const idx = list.findIndex((x) => x.id === item.id)
            const nextList = idx === -1 ? [...list, item] : list.map((x, i) => (i === idx ? item : x))
            return { ...prev, [table]: nextList }
          })
        },
      )
    }
    channel.subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloud, user?.id])

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
        const schedules = defaultSchedulesFor(vehicle.id, Boolean(fields.newDriver))
        commit((d) => ({
          ...d,
          vehicles: [...d.vehicles, vehicle],
          schedules: [...d.schedules, ...schedules],
        }))
        if (cloud) {
          fireAndAlert(supabase.from('vehicles').insert(toVehicleRow(vehicle, user.id)))
          if (schedules.length) {
            fireAndAlert(supabase.from('schedules').insert(schedules.map((s) => toScheduleRow(s, user.id))))
          }
        }
        return vehicle
      },

      // Toggle newer-driver mode on an existing vehicle: on = add the monthly
      // walk-around + pressure check and tighten tire/brake intervals; off =
      // drop the walk-around (other intervals stay as the user has them).
      setNewDriver(vehicleId, enabled) {
        const prevSchedules = dataRef.current.schedules
        let schedules = prevSchedules
        const additions = []
        const updates = []
        let removedIds = []
        if (enabled) {
          const has = (t) => schedules.some((s) => s.vehicleId === vehicleId && s.type === t)
          if (!has('safety-check'))
            additions.push({ id: uid(), vehicleId, type: 'safety-check', intervalMiles: null, intervalMonths: 1 })
          if (!has('tire-pressure'))
            additions.push({ id: uid(), vehicleId, type: 'tire-pressure', intervalMiles: null, intervalMonths: 1 })
          schedules = schedules
            .map((s) => {
              if (s.vehicleId !== vehicleId) return s
              if (s.type === 'brake-inspection' && (!s.intervalMonths || s.intervalMonths > 6)) {
                const next = { ...s, intervalMonths: 6 }
                updates.push(next)
                return next
              }
              if (s.type === 'tire-rotation' && (!s.intervalMiles || s.intervalMiles > 5000)) {
                const next = { ...s, intervalMiles: 5000 }
                updates.push(next)
                return next
              }
              return s
            })
            .concat(additions)
        } else {
          removedIds = schedules
            .filter((s) => s.vehicleId === vehicleId && s.type === 'safety-check')
            .map((s) => s.id)
          schedules = schedules.filter((s) => !(s.vehicleId === vehicleId && s.type === 'safety-check'))
        }
        commit((d) => ({
          ...d,
          vehicles: d.vehicles.map((v) => (v.id === vehicleId ? { ...v, newDriver: enabled } : v)),
          schedules,
        }))
        if (cloud) {
          fireAndAlert(supabase.from('vehicles').update({ new_driver: enabled }).eq('id', vehicleId))
          if (additions.length) {
            fireAndAlert(supabase.from('schedules').insert(additions.map((s) => toScheduleRow(s, user.id))))
          }
          for (const s of updates) {
            fireAndAlert(
              supabase
                .from('schedules')
                .update({ interval_miles: s.intervalMiles, interval_months: s.intervalMonths })
                .eq('id', s.id),
            )
          }
          if (removedIds.length) {
            fireAndAlert(supabase.from('schedules').delete().in('id', removedIds))
          }
        }
      },

      updateVehicle(id, patch) {
        commit((d) => ({
          ...d,
          vehicles: d.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        }))
        if (cloud) {
          const merged = { ...dataRef.current.vehicles.find((v) => v.id === id) }
          fireAndAlert(supabase.from('vehicles').update(toVehicleRow(merged, user.id)).eq('id', id))
        }
      },

      deleteVehicle(id) {
        commit((d) => ({
          ...d,
          vehicles: d.vehicles.filter((v) => v.id !== id),
          services: d.services.filter((s) => s.vehicleId !== id),
          schedules: d.schedules.filter((s) => s.vehicleId !== id),
          recommendations: d.recommendations.filter((r) => r.vehicleId !== id),
          fillups: d.fillups.filter((f) => f.vehicleId !== id),
        }))
        // Related rows are removed server-side via ON DELETE CASCADE.
        if (cloud) fireAndAlert(supabase.from('vehicles').delete().eq('id', id))
      },

      setMileage(vehicleId, miles) {
        const m = Number(miles)
        if (!Number.isFinite(m) || m < 0) return
        const stamp = todayStr()
        commit((d) => ({
          ...d,
          vehicles: d.vehicles.map((v) =>
            v.id === vehicleId ? { ...v, currentMileage: m, mileageUpdatedAt: stamp } : v,
          ),
        }))
        if (cloud) {
          fireAndAlert(
            supabase.from('vehicles').update({ current_mileage: m, mileage_updated_at: stamp }).eq('id', vehicleId),
          )
        }
      },

      addService(fields) {
        const service = {
          id: uid(),
          date: todayStr(),
          ...fields,
          mileage: fields.mileage === '' || fields.mileage == null ? null : Number(fields.mileage),
          cost: fields.cost === '' || fields.cost == null ? null : Number(fields.cost),
        }
        let bumpedVehicle = null
        commit((d) => {
          const vehicles = d.vehicles.map((v) => {
            if (v.id === service.vehicleId && service.mileage != null && service.mileage > v.currentMileage) {
              bumpedVehicle = { ...v, currentMileage: service.mileage, mileageUpdatedAt: todayStr() }
              return bumpedVehicle
            }
            return v
          })
          return { ...d, vehicles, services: [...d.services, service] }
        })
        if (cloud) {
          fireAndAlert(supabase.from('services').insert(toServiceRow(service, user.id)))
          if (bumpedVehicle) {
            fireAndAlert(
              supabase
                .from('vehicles')
                .update({ current_mileage: bumpedVehicle.currentMileage, mileage_updated_at: bumpedVehicle.mileageUpdatedAt })
                .eq('id', bumpedVehicle.id),
            )
          }
        }
        return service
      },

      // Gas fill-ups — kept separate from services so MPG math and fuel
      // spend don't pollute the maintenance history.
      addFillup(fields) {
        const fillup = {
          id: uid(),
          date: todayStr(),
          ...fields,
          mileage: fields.mileage === '' || fields.mileage == null ? null : Number(fields.mileage),
          gallons: fields.gallons === '' || fields.gallons == null ? null : Number(fields.gallons),
          cost: fields.cost === '' || fields.cost == null ? null : Number(fields.cost),
        }
        let bumpedVehicle = null
        commit((d) => {
          const vehicles = d.vehicles.map((v) => {
            if (v.id === fillup.vehicleId && fillup.mileage != null && fillup.mileage > v.currentMileage) {
              bumpedVehicle = { ...v, currentMileage: fillup.mileage, mileageUpdatedAt: todayStr() }
              return bumpedVehicle
            }
            return v
          })
          return { ...d, vehicles, fillups: [...d.fillups, fillup] }
        })
        if (cloud) {
          fireAndAlert(supabase.from('fillups').insert(toFillupRow(fillup, user.id)))
          if (bumpedVehicle) {
            fireAndAlert(
              supabase
                .from('vehicles')
                .update({ current_mileage: bumpedVehicle.currentMileage, mileage_updated_at: bumpedVehicle.mileageUpdatedAt })
                .eq('id', bumpedVehicle.id),
            )
          }
        }
        return fillup
      },

      deleteFillup(id) {
        commit((d) => ({ ...d, fillups: d.fillups.filter((f) => f.id !== id) }))
        if (cloud) fireAndAlert(supabase.from('fillups').delete().eq('id', id))
      },

      deleteService(id) {
        commit((d) => ({ ...d, services: d.services.filter((s) => s.id !== id) }))
        if (cloud) fireAndAlert(supabase.from('services').delete().eq('id', id))
      },

      addSchedule(fields) {
        const schedule = { id: uid(), ...fields }
        commit((d) => ({ ...d, schedules: [...d.schedules, schedule] }))
        if (cloud) fireAndAlert(supabase.from('schedules').insert(toScheduleRow(schedule, user.id)))
      },

      updateSchedule(id, patch) {
        commit((d) => ({
          ...d,
          schedules: d.schedules.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }))
        if (cloud) {
          const merged = dataRef.current.schedules.find((s) => s.id === id)
          fireAndAlert(supabase.from('schedules').update(toScheduleRow(merged, user.id)).eq('id', id))
        }
      },

      deleteSchedule(id) {
        commit((d) => ({ ...d, schedules: d.schedules.filter((s) => s.id !== id) }))
        if (cloud) fireAndAlert(supabase.from('schedules').delete().eq('id', id))
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
        commit((d) => ({ ...d, recommendations: [...d.recommendations, rec] }))
        if (cloud) fireAndAlert(supabase.from('recommendations').insert(toRecRow(rec, user.id)))
        return rec
      },

      updateRecommendation(id, patch) {
        commit((d) => ({
          ...d,
          recommendations: d.recommendations.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }))
        if (cloud) {
          const merged = dataRef.current.recommendations.find((r) => r.id === id)
          fireAndAlert(supabase.from('recommendations').update(toRecRow(merged, user.id)).eq('id', id))
        }
      },

      deleteRecommendation(id) {
        commit((d) => ({ ...d, recommendations: d.recommendations.filter((r) => r.id !== id) }))
        if (cloud) fireAndAlert(supabase.from('recommendations').delete().eq('id', id))
      },

      async importData(json) {
        const parsed = JSON.parse(json)
        if (!parsed || !Array.isArray(parsed.vehicles)) throw new Error('Not a CarCare backup file')
        const merged = { ...EMPTY, ...parsed }
        if (cloud) {
          // Full replace: clear this account's cloud data, then upload the
          // imported set. Child rows cascade-delete with their vehicle.
          const { error: delError } = await supabase.from('vehicles').delete().eq('user_id', user.id)
          if (delError) throw delError
          for (const table of TABLES) {
            const rows = merged[table]
            if (rows.length) {
              const { error } = await supabase.from(table).insert(rows.map((r) => ROW_MAP[table].toRow(r, user.id)))
              if (error) throw error
            }
          }
        }
        commit(merged)
      },

      exportData() {
        return JSON.stringify(dataRef.current, null, 2)
      },

      // One-time upload of pre-existing localStorage data into a freshly
      // signed-in cloud account. No-op if there's nothing local to bring over.
      // Reads the frozen pre-cloud snapshot, not the live cache, since the
      // live cache may already reflect the (still-empty) cloud state.
      async migrateLocalData() {
        if (!cloud) return
        const local = loadPreCloudBackup()
        if (!local.vehicles.length) return
        for (const table of TABLES) {
          const rows = local[table]
          if (rows.length) {
            const { error } = await supabase.from(table).insert(rows.map((r) => ROW_MAP[table].toRow(r, user.id)))
            if (error) throw error
          }
        }
        commit((d) => {
          const next = { ...d }
          for (const table of TABLES) next[table] = [...d[table], ...local[table]]
          return next
        })
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cloud, user?.id],
  )

  return { data, actions, loaded, cloud }
}

// Backup freshness — stamped when the user exports, read for the nudge banner.
export function lastBackupAt() {
  const v = localStorage.getItem(LAST_BACKUP_KEY)
  return v ? Number(v) : null
}

export function markBackupDone() {
  localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()))
}

export function daysSince(timestamp) {
  if (!timestamp) return null
  return Math.floor((Date.now() - timestamp) / 86400000)
}

// Does localStorage hold vehicle data from before cloud sync was set up?
export function hasLocalBackup() {
  return loadPreCloudBackup().vehicles.length > 0
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
