import { useRef, useState } from 'react'
import { useAppData, dueItems } from './lib/store'
import { openRecommendations } from './lib/recommendations'
import Dashboard from './components/Dashboard'
import Vehicles from './components/Vehicles'
import Costs from './components/Costs'
import Budget from './components/Budget'
import Recommendations from './components/Recommendations'
import Guides from './components/Guides'
import ServiceForm from './components/ServiceForm'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'repairs', label: 'Repairs' },
  { id: 'costs', label: 'Costs' },
  { id: 'budget', label: 'Budget' },
  { id: 'guides', label: 'DIY Guides' },
]

export default function App() {
  const { data, actions } = useAppData()
  const [view, setView] = useState({ name: 'dashboard', params: {} })
  const [serviceModal, setServiceModal] = useState(null) // { vehicleId?, type? }
  const fileInput = useRef(null)

  const navigate = (name, params = {}) => setView({ name, params })
  const onLogService = (vehicleId, type) => setServiceModal({ vehicleId, type })

  const attention = dueItems(data).length
  const openRepairs = openRecommendations(data).length

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carcare-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importBackup(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        actions.importData(reader.result)
        alert('Backup restored.')
      } catch (err) {
        alert(`Couldn't import: ${err.message}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={() => navigate('dashboard')} role="button" tabIndex={0}>
          <span className="brand-icon" aria-hidden="true">🔧</span> CarCare
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${view.name === t.id ? 'tab-active' : ''}`}
              onClick={() => navigate(t.id)}
            >
              {t.label}
              {t.id === 'dashboard' && attention > 0 && <span className="tab-badge">{attention}</span>}
              {t.id === 'repairs' && openRepairs > 0 && <span className="tab-badge">{openRepairs}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {view.name === 'dashboard' && (
          <Dashboard data={data} navigate={navigate} onLogService={onLogService} />
        )}
        {view.name === 'vehicles' && (
          <Vehicles
            data={data}
            actions={actions}
            params={view.params}
            navigate={navigate}
            onLogService={onLogService}
          />
        )}
        {view.name === 'repairs' && <Recommendations data={data} actions={actions} />}
        {view.name === 'costs' && <Costs data={data} />}
        {view.name === 'budget' && <Budget data={data} />}
        {view.name === 'guides' && <Guides params={view.params} navigate={navigate} />}
      </main>

      <footer className="footer">
        <span className="muted">Your data lives only in this browser.</span>
        <span className="footer-actions">
          <button className="btn-link" onClick={exportBackup}>Export backup</button>
          <button className="btn-link" onClick={() => fileInput.current?.click()}>Import</button>
          <input ref={fileInput} type="file" accept=".json" hidden onChange={importBackup} />
        </span>
      </footer>

      {serviceModal && (
        <ServiceForm
          vehicles={data.vehicles}
          defaultVehicleId={serviceModal.vehicleId}
          defaultType={serviceModal.type}
          onSave={(f) => actions.addService(f)}
          onClose={() => setServiceModal(null)}
        />
      )}
    </div>
  )
}
