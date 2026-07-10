import { useState } from 'react'
import { Modal } from './ui'

// Device-to-device transfer without a server: copy the data blob on one
// device, paste it on the other. Works over any channel that can carry text
// (email to yourself, messaging app, cloud note).
export default function Transfer({ data, actions, onClose }) {
  const [mode, setMode] = useState('send') // send | receive
  const [pasted, setPasted] = useState('')
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(data)

  async function copy() {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
    } catch {
      // Clipboard API can be blocked — the textarea below is selectable as a fallback.
    }
  }

  function receive() {
    try {
      actions.importData(pasted)
      alert('Data imported — this device now matches the one you copied from.')
      onClose()
    } catch (err) {
      alert(`Couldn't import: ${err.message}`)
    }
  }

  return (
    <Modal title="Transfer between devices" onClose={onClose}>
      <div className="transfer-tabs">
        <button className={`btn btn-small ${mode === 'send' ? 'btn-primary' : ''}`} onClick={() => setMode('send')}>
          Send from this device
        </button>
        <button className={`btn btn-small ${mode === 'receive' ? 'btn-primary' : ''}`} onClick={() => setMode('receive')}>
          Receive on this device
        </button>
      </div>

      {mode === 'send' ? (
        <div className="form">
          <p className="muted">
            Copy everything below and get it to the other device however you like — email it to
            yourself, paste it in a message, a shared note. On the other device, open this same
            dialog and choose "Receive".
          </p>
          <textarea readOnly rows={6} value={json} onFocus={(e) => e.target.select()} />
          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>Close</button>
            <button type="button" className="btn btn-primary" onClick={copy}>
              {copied ? '✓ Copied' : 'Copy to clipboard'}
            </button>
          </div>
        </div>
      ) : (
        <div className="form">
          <p className="muted">
            Paste the data copied from your other device. <strong>This replaces everything on this
            device</strong> — export a backup first if this device has anything worth keeping.
          </p>
          <textarea
            rows={6}
            placeholder="Paste here…"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
          />
          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" disabled={!pasted.trim()} onClick={receive}>
              Import & replace
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
