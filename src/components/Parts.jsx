import { serviceLabel, serviceType } from '../lib/serviceTypes'
import { partInfoFor, vehicleProfile } from '../data/partsCatalog'
import { shopLinks } from '../lib/partsLookup'
import { GUIDES } from '../data/guides'

function guideFor(serviceTypeId) {
  const guideId = serviceType(serviceTypeId)?.guideId
  return guideId ? GUIDES.find((g) => g.id === guideId) : null
}

function PartCard({ vehicle, serviceTypeId }) {
  const info = partInfoFor(vehicle, serviceTypeId)
  const guide = guideFor(serviceTypeId)
  const label = serviceLabel(serviceTypeId)
  const query = info?.partNumber || info?.name || label
  const links = shopLinks(vehicle, query)

  return (
    <li className="parts-card">
      <div className="parts-card-head">
        <strong>{label}</strong>
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
      </div>
      <p className="parts-source-note">Always confirm fitment against your VIN before buying.</p>
    </li>
  )
}

export default function PartsSection({ vehicle, schedules }) {
  const profile = vehicleProfile(vehicle)
  // Only show parts for reminder types that actually involve a physical part.
  const partTypes = ['oil-change', 'engine-air-filter', 'cabin-air-filter', 'wiper-blades', 'battery', 'brake-pads', 'differential-fluid', 'transmission-fluid', 'brake-fluid', 'coolant', 'spark-plugs']
  const relevant = schedules
    .map((s) => s.schedule.type)
    .filter((t, i, arr) => arr.indexOf(t) === i && partTypes.includes(t))

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
