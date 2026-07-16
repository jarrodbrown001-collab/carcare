import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function SignInScreen() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      await signInWithEmail(email.trim())
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1><span aria-hidden="true">🔧</span> CarCare</h1>
        <p className="muted">Sign in to sync your vehicles across devices.</p>
        {status === 'sent' ? (
          <p>
            Check <strong>{email}</strong> for a sign-in link, then open it on this device.
          </p>
        ) : (
          <form onSubmit={submit} className="form">
            <label>
              Email
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            {status === 'error' && <p className="text-overdue">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending link…' : 'Send sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
