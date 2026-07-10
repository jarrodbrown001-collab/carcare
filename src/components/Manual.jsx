import { useEffect, useRef, useState } from 'react'
import { manualSourceFor } from '../data/manualSources'
import { saveManual, getManual, deleteManual, manualToBlobUrl } from '../lib/manualStore'

function VinField({ vehicle, actions }) {
  const [vin, setVin] = useState(vehicle.vin ?? '')
  const dirty = vin !== (vehicle.vin ?? '')

  function save() {
    actions.updateVehicle(vehicle.id, { vin: vin.trim().toUpperCase() })
  }

  return (
    <label className="vin-field">
      VIN
      <span className="vin-row">
        <input
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          placeholder="17-character VIN"
          maxLength={17}
          autoCapitalize="characters"
        />
        <button className="btn btn-small" onClick={save} disabled={!dirty}>
          {vehicle.vin ? 'Update' : 'Save'}
        </button>
      </span>
    </label>
  )
}

export default function ManualSection({ vehicle, actions }) {
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSteps, setShowSteps] = useState(false)
  const fileInput = useRef(null)
  const source = manualSourceFor(vehicle.make)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getManual(vehicle.id).then((r) => {
      if (!cancelled) {
        setRecord(r ?? null)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [vehicle.id])

  async function onUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.')
      return
    }
    await saveManual(vehicle.id, file)
    setRecord(await getManual(vehicle.id))
  }

  async function onRemove() {
    if (!window.confirm('Remove the stored owner\'s manual for this vehicle?')) return
    await deleteManual(vehicle.id)
    setRecord(null)
  }

  function onView() {
    const url = manualToBlobUrl(record)
    if (url) window.open(url, '_blank', 'noopener')
  }

  return (
    <section>
      <div className="section-head">
        <h2>Owner's manual</h2>
      </div>
      <p className="muted">
        The manufacturer's own manual is the most reliable source for what your vehicle actually needs — a
        real reference point when a shop recommends something that isn't in the book.
      </p>

      <VinField vehicle={vehicle} actions={actions} />

      {!loading && record && (
        <div className="due-row">
          <div className="due-main">
            <span className="due-title">✓ {record.name}</span>
            <span className="muted">
              {(record.size / 1024 / 1024).toFixed(1)} MB · uploaded {new Date(record.savedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="due-actions">
            <button className="btn btn-small" onClick={onView}>View</button>
            <button className="btn btn-small" onClick={() => fileInput.current?.click()}>Replace</button>
            <button className="btn btn-small btn-danger" onClick={onRemove}>Remove</button>
          </div>
        </div>
      )}

      {!loading && !record && (
        <div className="manual-setup">
          <button className="btn btn-small" onClick={() => setShowSteps((s) => !s)}>
            {showSteps ? 'Hide' : 'How do I get the manual?'}
          </button>
          {showSteps && (
            <ol className="manual-steps">
              {source.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          )}
          {source.url && (
            <p>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                Open {source.name} ↗
              </a>
            </p>
          )}
          <button className="btn btn-primary btn-small" onClick={() => fileInput.current?.click()}>
            Upload manual PDF
          </button>
        </div>
      )}

      <input ref={fileInput} type="file" accept="application/pdf" hidden onChange={onUpload} />
    </section>
  )
}
