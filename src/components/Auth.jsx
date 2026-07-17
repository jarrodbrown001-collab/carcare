import { useState } from 'react'
import { useAuth } from '../lib/auth'

function FieldError({ children }) {
  return children ? <p className="text-overdue">{children}</p> : null
}

export default function SignInScreen() {
  const {
    signInWithPassword,
    signUpWithPassword,
    signInWithEmail,
    requestPasswordReset,
    updatePassword,
    passwordRecovery,
    clearPasswordRecovery,
  } = useAuth()

  const [mode, setMode] = useState('signin') // signin | signup | forgot | magic
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState('idle') // idle | busy | sent | error
  const [error, setError] = useState('')

  function switchMode(next) {
    setStatus('idle')
    setError('')
    setPassword('')
    setConfirmPassword('')
    setMode(next)
  }

  async function submitSignIn(e) {
    e.preventDefault()
    setStatus('busy')
    setError('')
    try {
      await signInWithPassword(email.trim(), password)
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  async function submitSignUp(e) {
    e.preventDefault()
    if (password.length < 6) {
      setStatus('error')
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setStatus('error')
      setError("Passwords don't match.")
      return
    }
    setStatus('busy')
    setError('')
    try {
      const data = await signUpWithPassword(email.trim(), password)
      // A null session means Supabase is waiting on email confirmation.
      setStatus(data?.session ? 'idle' : 'sent')
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  async function submitForgot(e) {
    e.preventDefault()
    setStatus('busy')
    setError('')
    try {
      await requestPasswordReset(email.trim())
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  async function submitMagic(e) {
    e.preventDefault()
    setStatus('busy')
    setError('')
    try {
      await signInWithEmail(email.trim())
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  async function submitNewPassword(e) {
    e.preventDefault()
    if (newPassword.length < 6) {
      setStatus('error')
      setError('Password must be at least 6 characters.')
      return
    }
    setStatus('busy')
    setError('')
    try {
      await updatePassword(newPassword)
      clearPasswordRecovery()
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  if (passwordRecovery) {
    return (
      <div className="page auth-page">
        <div className="auth-card">
          <h1><span aria-hidden="true">🔧</span> CarCare</h1>
          <p className="muted">Set a new password for your account.</p>
          <form onSubmit={submitNewPassword} className="form">
            <label>
              New password
              <input
                type="password"
                required
                autoFocus
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </label>
            <FieldError>{status === 'error' ? error : ''}</FieldError>
            <button type="submit" className="btn btn-primary" disabled={status === 'busy'}>
              {status === 'busy' ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1><span aria-hidden="true">🔧</span> CarCare</h1>

        {mode === 'signin' && (
          <>
            <p className="muted">Sign in to sync your vehicles across devices.</p>
            <form onSubmit={submitSignIn} className="form">
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
              <label>
                Password
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                />
              </label>
              <FieldError>{status === 'error' ? error : ''}</FieldError>
              <button type="submit" className="btn btn-primary" disabled={status === 'busy'}>
                {status === 'busy' ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="auth-links">
              <button type="button" className="btn-link" onClick={() => switchMode('forgot')}>Forgot password?</button>
              <button type="button" className="btn-link" onClick={() => switchMode('signup')}>Create an account</button>
              <button type="button" className="btn-link" onClick={() => switchMode('magic')}>Use a sign-in link instead</button>
            </p>
          </>
        )}

        {mode === 'signup' && (
          <>
            <p className="muted">Create an account to sync your vehicles across devices.</p>
            {status === 'sent' ? (
              <p>Check <strong>{email}</strong> to confirm your account, then sign in.</p>
            ) : (
              <form onSubmit={submitSignUp} className="form">
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
                <label>
                  Password
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </label>
                <label>
                  Confirm password
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Type it again"
                  />
                </label>
                <FieldError>{status === 'error' ? error : ''}</FieldError>
                <button type="submit" className="btn btn-primary" disabled={status === 'busy'}>
                  {status === 'busy' ? 'Creating account…' : 'Create account'}
                </button>
              </form>
            )}
            <p className="auth-links">
              <button type="button" className="btn-link" onClick={() => switchMode('signin')}>
                Already have an account? Sign in
              </button>
            </p>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <p className="muted">We'll email you a link to set a new password.</p>
            {status === 'sent' ? (
              <p>Check <strong>{email}</strong> for a password reset link.</p>
            ) : (
              <form onSubmit={submitForgot} className="form">
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
                <FieldError>{status === 'error' ? error : ''}</FieldError>
                <button type="submit" className="btn btn-primary" disabled={status === 'busy'}>
                  {status === 'busy' ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}
            <p className="auth-links">
              <button type="button" className="btn-link" onClick={() => switchMode('signin')}>Back to sign in</button>
            </p>
          </>
        )}

        {mode === 'magic' && (
          <>
            <p className="muted">We'll email you a link that signs you in — no password needed.</p>
            {status === 'sent' ? (
              <p>Check <strong>{email}</strong> for a sign-in link, then open it on this device.</p>
            ) : (
              <form onSubmit={submitMagic} className="form">
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
                <FieldError>{status === 'error' ? error : ''}</FieldError>
                <button type="submit" className="btn btn-primary" disabled={status === 'busy'}>
                  {status === 'busy' ? 'Sending link…' : 'Send sign-in link'}
                </button>
              </form>
            )}
            <p className="auth-links">
              <button type="button" className="btn-link" onClick={() => switchMode('signin')}>
                Back to password sign-in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
