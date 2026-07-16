import { serviceLabel, serviceType } from '../lib/serviceTypes'
import { partInfoFor, vehicleProfile } from '../data/partsCatalog'
import { shopLinks, youtubeSearchLink } from '../lib/partsLookup'
import { getManualBlobUrl } from '../lib/manualStore'
import { useAuth } from '../lib/auth.jsx'
import { GUIDES } from '../data/guides'

function guideFor(serviceTypeId) {
  const guideId = serviceType(serviceTypeId)?.guideId
  return guideId ? GUIDES.find((g) => g.id === guideId) : null
}

// Chrome's PDF viewer honors #page= on blob URLs, so this jumps the stored
// manual straight to the page the spec came from.
async function openManualPage(vehicleId, page, userId) {
  try {
    const url = await getManualBlobUrl(vehicleId, userId)
    if (!url) {
      alert("No manual PDF uploaded for this vehicle yet — add one in the Owner's manual section above.")
      return
    }
    window.open(`${url}#page=${page}`, '_blank', 'noopener')
  } catch (err) {
    alert(`Couldn't open the manual: ${err.message}`)
  }
}

function PartCard({ vehicle, serviceTypeId }) {
  const { user } = useAuth()
  const info = partInfoFor(vehicle, serviceTypeId)
  const guide = guideFor(serviceTypeId)
  const label = serviceLabel(serviceTypeId)
  const query = info?.partNumber || info?.name || label
  const links = shopLinks(vehicle, query)
  const ytLink = youtubeSearchLink(vehicle, label)

  return (
    <li className="parts-card">
      <div className="parts-card-head">
        <strong>{label}</strong>
        {info?.source && <span className="parts-source-badge">from {info.source}</span>}
      </div>
      {info ? (
        <>
          {info.spec && <p className="parts-spec"><span className="parts-spec-label">Spec: </span>{info.spec}</p>}
          {info.partNumber && <p className="parts-spec"><span className="parts-spec-label">Part: </span>{info.partNumber}</p>}
        </>
      ) : (
        <p className="parts-spec muted">
          No saved spec for this vehicle yet — use the links below to look it up by year/make/model.
        </p>
      )}
      {guide?.tools?.length > 0 && (
        <p className="parts-materials">
          <span className="parts-spec-label">Tools/materials: </span>{guide.tools.join(', ')}
        </p>
      )}
      <div className="parts-links">
        {links.map((l) => (
          <a key={l.name} className="btn btn-small" href={l.url} target="_blank" rel="noopener noreferrer">
            {l.name} ↗
          </a>
        ))}
        <a className="btn btn-small" href={ytLink} target="_blank" rel="noopener noreferrer">
          ▶ DIY videos ↗
        </a>
        {info?.manualPage && (
          <button className="btn btn-small" onClick={() => openManualPage(vehicle.id, info.manualPage, user?.id)}>
            📖 Manual p.{info.manualPage}
          </button>
        )}
      </div>
      <p className="parts-source-note">Always confirm fitment against your VIN before buying.</p>
    </li>
  )
}

export default function PartsSection({ vehicle, schedules }) {
  const profile = vehicleProfile(vehicle)
  // Only show parts for reminder types that actually involve a physical part.
  const partTypes = ['oil-change', 'engine-air-filter', 'cabin-air-filter', 'wiper-blades', 'battery', 'brake-pads', 'differential-fluid', 'transmission-fluid', 'brake-fluid', 'coolant', 'spark-plugs']
  const scheduleTypes = schedules.map((s) => s.schedule.type).filter((t) => partTypes.includes(t))
  // Include everything we have real manual-sourced data for too, even if it
  // isn't on an active reminder schedule (e.g. spark plugs, coolant).
  const profileTypes = profile ? Object.keys(profile.parts) : []
  const relevant = [...new Set([...scheduleTypes, ...profileTypes])]

  if (relevant.length === 0) return null

  return (
    <section>
      <div className="section-head">
        <h2>Parts & shopping</h2>
      </div>
      {!profile && (
        <p className="muted">
          No saved part specs for this exact vehicle yet — the links below still work, they just search by
          year/make/model instead of an exact part number.
        </p>
      )}
      <ul className="parts-list">
        {relevant.map((t) => (
          <PartCard key={t} vehicle={vehicle} serviceTypeId={t} />
        ))}
      </ul>
    </section>
  )
}
