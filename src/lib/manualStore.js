// Owner's-manual PDFs.
//
// Signed out (or cloud sync disabled): stored in IndexedDB rather than the
// main localStorage blob — they're binary and can be several MB each, well
// past what's safe to keep in the JSON backup that also holds vehicle history.
//
// Signed in: stored in a private Supabase Storage bucket ("manuals") at
// `${userId}/${vehicleId}.pdf` so the manual follows the vehicle across
// devices too.
import { supabase, cloudEnabled } from './supabaseClient'

const DB_NAME = 'carcare-manuals'
const STORE = 'manuals'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'vehicleId' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    const req = fn(store)
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
  })
}

function cloudPath(userId, vehicleId) {
  return `${userId}/${vehicleId}.pdf`
}

export async function saveManual(vehicleId, file, userId) {
  if (cloudEnabled && userId) {
    const { error } = await supabase.storage
      .from('manuals')
      .upload(cloudPath(userId, vehicleId), file, { upsert: true, contentType: file.type || 'application/pdf' })
    if (error) throw error
    return
  }
  const buffer = await file.arrayBuffer()
  await withStore('readwrite', (store) =>
    store.put({ vehicleId, name: file.name, type: file.type, size: file.size, data: buffer, savedAt: Date.now() }),
  )
}

// Cheap existence + display info — no PDF bytes transferred.
export async function getManualMeta(vehicleId, userId) {
  if (cloudEnabled && userId) {
    const { data, error } = await supabase.storage.from('manuals').list(userId, { search: `${vehicleId}.pdf` })
    if (error) throw error
    const item = data?.find((f) => f.name === `${vehicleId}.pdf`)
    if (!item) return null
    return {
      name: "Owner's manual.pdf",
      size: item.metadata?.size ?? 0,
      savedAt: item.updated_at ? new Date(item.updated_at).getTime() : Date.now(),
    }
  }
  const record = await withStore('readonly', (store) => store.get(vehicleId))
  return record ? { name: record.name, size: record.size, savedAt: record.savedAt } : null
}

// Fetches the PDF bytes on demand and returns a blob: URL, or null if no
// manual is stored for this vehicle.
export async function getManualBlobUrl(vehicleId, userId) {
  if (cloudEnabled && userId) {
    const { data, error } = await supabase.storage.from('manuals').download(cloudPath(userId, vehicleId))
    if (error) throw error
    return URL.createObjectURL(data)
  }
  const record = await withStore('readonly', (store) => store.get(vehicleId))
  if (!record) return null
  const blob = new Blob([record.data], { type: record.type || 'application/pdf' })
  return URL.createObjectURL(blob)
}

export async function openManual(vehicleId, userId) {
  const url = await getManualBlobUrl(vehicleId, userId)
  if (url) window.open(url, '_blank', 'noopener')
}

export async function deleteManual(vehicleId, userId) {
  if (cloudEnabled && userId) {
    const { error } = await supabase.storage.from('manuals').remove([cloudPath(userId, vehicleId)])
    if (error) throw error
    return
  }
  await withStore('readwrite', (store) => store.delete(vehicleId))
}
