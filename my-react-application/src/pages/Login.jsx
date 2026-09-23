import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth.js'

/** Render the sign-in form and redirect authenticated users. */
function Login() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/events" replace />
  }

  /** Authenticate the submitted credentials and open the events page. */
  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    // DEMO BUG: logging the password field
    console.log('Attempting login for', username, 'with password length', password.length)

    try {
      await login(username, password)
      navigate('/events')
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Unable to sign in.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="events-page">
      <div className="events-content event-form-content">
        <h2>Sign in</h2>
        <p>Sign in to create, edit, or delete events.</p>

        <form className="event-form" onSubmit={handleSubmit}>
          <label className="event-form-field">
            <span>Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={submitting}
              required
            />
          </label>

          <label className="event-form-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              required
            />
          </label>

          {error && <p className="time-error">{error}</p>}

          <div className="event-form-actions">
            <button type="submit" className="time-button" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
            <Link to="/events" className="time-button event-form-link">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

export default Login
