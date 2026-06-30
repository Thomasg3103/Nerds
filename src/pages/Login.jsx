import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email to confirm your account, then log in.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="login-logo">CI</span>
        <h1 className="login-title">Collection Intelligence</h1>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(null); setMessage(null) }}
          >
            Log in
          </button>
          <button
            className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
          >
            Sign up
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              className="login-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <label className="login-label">
            Password
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="login-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>

          {error   && <p className="login-error">{error}</p>}
          {message && <p className="login-message">{message}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
