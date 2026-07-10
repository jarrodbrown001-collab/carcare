import { useState } from 'react'
import { fetchRecalls } from '../lib/recalls'

// On-demand rather than automatic — no point hammering NHTSA on every page
// view for data that changes a few times a year.
export default function RecallsSection({ vehicle }) {
  const [state, setState] = useState('idle') // idle | busy | done | error
  const [recalls, setRecalls] = useState([])

  async function check() {
    setState('busy')
    try {
      setRecalls(await fetchRecalls(vehicle))
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <section>
      <div className="section-head">
        <h2>Safety recalls</h2>
        <button className="btn btn-small" onClick={check} disabled={state === 'busy'}>
          {state === 'busy' ? 'Checking…' : state === 'done' ? 'Re-check' : 'Check NHTSA for recalls'}
        </button>
      </div>

      {state === 'idle' && (
        <p className="muted">
          Checks the official NHTSA database for open recalls on a {vehicle.year} {vehicle.make}{' '}
          {vehicle.model}. Recall repairs are free at any dealer, no matter where you bought the car.
        </p>
      )}
      {state === 'error' && (
        <p className="muted">Couldn't reach NHTSA — check your connection and try again.</p>
      )}
      {state === 'done' && recalls.length === 0 && (
        <p className="text-ok">✓ No recalls found for this year/make/model.</p>
      )}
      {state === 'done' && recalls.length > 0 && (
        <ul className="recall-list">
          {recalls.map((r, i) => (
            <li key={r.NHTSACampaignNumber ?? i} className="recall-item">
              <details>
                <summary>
                  <strong>{r.Component}</strong>
                  <span className="muted"> · {r.NHTSACampaignNumber} · {r.ReportReceivedDate}</span>
                </summary>
                <p>{r.Summary}</p>
                {r.Remedy && <p><span className="parts-spec-label">Remedy: </span>{r.Remedy}</p>}
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
