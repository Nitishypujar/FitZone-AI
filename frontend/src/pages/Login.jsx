import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

function Login() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')

    if (!formData.email || !formData.password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.')
      }

      // Store authentication information locally
      localStorage.setItem('fitzone_user', JSON.stringify(data.user))
      localStorage.setItem(
        'fitzone_access_token',
        data.session.access_token
      )
      localStorage.setItem(
        'fitzone_refresh_token',
        data.session.refresh_token
      )

      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)

      setError(
        error.message ||
          'Unable to sign in. Please check your credentials and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-container">
        <div className="auth-intro">
          <Link to="/" className="auth-brand">
            <span className="brand-mark">F</span>

            <span className="brand-name">
              FitZone<span>AI</span>
            </span>
          </Link>

          <p className="eyebrow">WELCOME BACK</p>

          <h1>
            Your fitness
            <br />
            <span>journey continues.</span>
          </h1>

          <p>
            Sign in to access your workouts, progress, goals, and personalized
            FitZone AI experience.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Sign in</h2>

            <p>Enter your details to continue.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email address

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              Password

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Login