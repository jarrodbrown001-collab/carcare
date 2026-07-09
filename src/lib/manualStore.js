// Owner's-manual PDFs are stored in IndexedDB rather than the main
// localStorage blob — they're binary and can be several MB each, well past
// what's safe to keep in the JSON backup that also holds vehicle history.
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

export async function saveManual(vehicleId, file) {
  const buffer = await file.arrayBuffer()
  return withStore('readwrite', (store) =>
    store.put({ vehicleId, name: file.name, type: file.type, size: file.size, data: buffer, savedAt: Date.now() }),
  )
}

export async function getManual(vehicleId) {
  return withStore('readonly', (store) => store.get(vehicleId))
}

export async function deleteManual(vehicleId) {
  return withStore('readwrite', (store) => store.delete(vehicleId))
}

export function manualToBlobUrl(record) {
  if (!record) return null
  const blob = new Blob([record.data], { type: record.type || 'application/pdf' })
  return URL.createObjectURL(blob)
}
