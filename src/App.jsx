import { useEffect, useRef, useState } from 'react'
import { useAppData, dueItems, lastBackupAt, markBackupDone, daysSince, hasLocalBackup } from './lib/store'
import { useAuth } from './lib/auth.jsx'
import { cloudEnabled } from './lib/supabaseClient'
import { openRecommendations } from './lib/recommendations'
import { buildSampleData } from './lib/sampleData'
import { maybeNotifyDue } from './lib/notify'
import Dashboard from './components/Dashboard'
import Vehicles from './components/Vehicles'
import Costs from './components/Costs'
import Budget from './components/Budget'
import Recommendations from './components/Recommendations'
import Guides from './components/Guides'
import Fuel from './components/Fuel'
import ServiceForm from './components/ServiceForm'
import Transfer from './components/Transfer'
import SignInScreen from './components/Auth.jsx'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'repairs', label: 'Repairs' },
  { id: 'fuel', label: 'Fuel' },
  { id: 'costs', label: 'Costs' },
  { id: 'budget', label: 'Budget' },
  { id: 'guides', label: 'DIY Guides' },
]

// Nag threshold for the backup banner — long enough to not be annoying,
// short enough that a lost browser profile can't erase months of history.
const BACKUP_STALE_DAYS = 14

export default function App() {
  const { user, loading: authLoading, signOut, passwordRecovery } = useAuth()
  const { data, actions, loaded, cloud } = useAppData(user)
  const [view, setView] = useState({ name: 'dashboard', params: {} })
  const [serviceModal, setServiceModal] = useState(null) // { vehicleId?, type? }
  const [transferOpen, setTransferOpen] = useState(false)
  const [backupDismissed, setBackupDismissed] = useState(false)
  const [backupStamp, setBackupStamp] = useState(lastBackupAt)
  const [migrateState, setMigrateState] = useState('idle') // idle | offering | migrating | done | dismissed
  const fileInput = useRef(null)

  const navigate = (name, params = {}) => setView({ name, params })
  const onLogService = (vehicleId, type) => setServiceModal({ vehicleId, type })

  const attention = dueItems(data).length
  const openRepairs = openRecommendations(data).length

  // One heads-up per day, at most, when the app opens with items due.
  useEffect(() => {
    maybeNotifyDue(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // First sign-in on a device that already has local vehicle data: offer to
  // bring it into the new cloud account once, rather than silently orphaning it.
  useEffect(() => {
    if (cloud && loaded && migrateState === 'idle') {
      setMigrateState(data.vehicles.length === 0 && hasLocalBackup() ? 'offering' : 'dismissed')
    }
  }, [cloud, loaded, migrateState, data.vehicles.length])

  async function migrateLocalData() {
    setMigrateState('migrating')
    try {
      await actions.migrateLocalData()
      setMigrateState('done')
    } catch (err) {
      alert(`Couldn't migrate your local data: ${err.message}`)
      setMigrateState('offering')
    }
  }

  const hasData = data.vehicles.length > 0
  const backupAge = daysSince(backupStamp)
  const backupStale = hasData && !backupDismissed && (backupStamp == null || backupAge > BACKUP_STALE_DAYS)

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carcare-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    markBackupDone()
    setBackupStamp(lastBackupAt())
  }

  function importBackup(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await actions.importData(reader.result)
        alert('Backup restored.')
      } catch (err) {
        alert(`Couldn't import: ${err.message}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (cloudEnabled && authLoading) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (cloudEnabled && (!user || passwordRecovery)) {
    return <SignInScreen />
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
        {cloud && (
          <div className="account-menu">
            <span className="muted">{user.email}</span>
            <button className="btn-link" onClick={signOut}>Sign out</button>
          </div>
        )}
      </header>

      {cloud && !loaded && (
        <div className="banner">
          <span>Loading your synced data…</span>
        </div>
      )}

      {migrateState === 'offering' && (
        <div className="banner">
          <span>📦 Found vehicle data saved on this device from before you signed in. Bring it into your account?</span>
          <span className="banner-actions">
            <button className="btn btn-small btn-primary" onClick={migrateLocalData}>Upload to my account</button>
            <button className="btn-icon" aria-label="Dismiss" onClick={() => setMigrateState('dismissed')}>✕</button>
          </span>
        </div>
      )}
      {migrateState === 'migrating' && (
        <div className="banner">
          <span>Uploading your local data…</span>
        </div>
      )}

      {backupStale && (
        <div className="banner">
          <span>
            💾 {backupStamp == null
              ? cloud
                ? 'This device has never exported a local backup file.'
                : "Your data lives only in this browser and has never been backed up."
              : `Last backup was ${backupAge} days ago.`}
          </span>
          <span className="banner-actions">
            <button className="btn btn-small btn-primary" onClick={exportBackup}>Export backup now</button>
            <button className="btn-icon" aria-label="Dismiss" onClick={() => setBackupDismissed(true)}>✕</button>
          </span>
        </div>
      )}

      <main className="content">
        {view.name === 'dashboard' && (
          <Dashboard
            data={data}
            navigate={navigate}
            onLogService={onLogService}
            onLoadSample={() =>
              actions
                .importData(JSON.stringify(buildSampleData()))
                .catch((err) => alert(`Couldn't load sample data: ${err.message}`))
            }
          />
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
        {view.name === 'fuel' && <Fuel data={data} actions={actions} />}
        {view.name === 'costs' && <Costs data={data} />}
        {view.name === 'budget' && <Budget data={data} />}
        {view.name === 'guides' && <Guides params={view.params} navigate={navigate} />}
      </main>

      <footer className="footer">
        <span className="muted">
          {cloud ? 'Synced to your account.' : 'Your data lives only in this browser.'}
        </span>
        <span className="footer-actions">
          <button className="btn-link" onClick={exportBackup}>Export backup</button>
          <button className="btn-link" onClick={() => fileInput.current?.click()}>Import</button>
          {!cloud && (
            <button className="btn-link" onClick={() => setTransferOpen(true)}>Transfer devices</button>
          )}
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
      {transferOpen && (
        <Transfer data={data} actions={actions} onClose={() => setTransferOpen(false)} />
      )}
    </div>
  )
}
