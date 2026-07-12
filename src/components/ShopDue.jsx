import { dueItems } from '../lib/store'
import { serviceLabel } from '../lib/serviceTypes'
import { partInfoFor } from '../data/partsCatalog'
import { shopLinks, youtubeSearchLink } from '../lib/partsLookup'
import { vehicleName, dueDetail } from '../lib/labels'
import { Modal } from './ui'

// One place to shop for everything that's currently due, instead of opening
// each vehicle page and hunting for the right part card.
export default function ShopDue({ data, onClose }) {
  const due = dueItems(data)

  return (
    <Modal title="Shop for due items" onClose={onClose}>
      {due.length === 0 ? (
        <p className="muted">Nothing is due — nice.</p>
      ) : (
        <ul className="parts-list">
          {due.map((item) => {
            const label = serviceLabel(item.schedule.type)
            const info = partInfoFor(item.vehicle, item.schedule.type)
            const query = info?.partNumber || info?.name || label
            const links = shopLinks(item.vehicle, query)
            return (
              <li key={item.schedule.id} className="parts-card">
                <div className="parts-card-head">
                  <strong>{label}</strong>
                  <span className="muted">{vehicleName(item.vehicle)} · {dueDetail(item)}</span>
                </div>
                {info?.partNumber && (
                  <p className="parts-spec"><span className="parts-spec-label">Part: </span>{info.partNumber}</p>
                )}
                {info?.spec && (
                  <p className="parts-spec"><span className="parts-spec-label">Spec: </span>{info.spec}</p>
                )}
                <div className="parts-links">
                  {links.slice(0, 2).map((l) => (
                    <a key={l.name} className="btn btn-small" href={l.url} target="_blank" rel="noopener noreferrer">
                      {l.name} ↗
                    </a>
                  ))}
                  <a
                    className="btn btn-small"
                    href={youtubeSearchLink(item.vehicle, label)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ▶ DIY videos ↗
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
