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
      const response = await fetch(
        'http://localhost:5000/api/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Login failed.'
        )
      }

      // IMPORTANT:
      // server.js returns tokens inside data.session
      const accessToken = data.session?.access_token
      const refreshToken = data.session?.refresh_token

      if (!accessToken) {
        throw new Error(
          'Login succeeded, but no authentication token was returned.'
        )
      }

      // Clear any old authentication data first.
      localStorage.removeItem('fitzone_access_token')
      localStorage.removeItem('fitzone_refresh_token')
      localStorage.removeItem('fitzone_user')

      // Store the NEW session.
      localStorage.setItem(
        'fitzone_access_token',
        accessToken
      )

      if (refreshToken) {
        localStorage.setItem(
          'fitzone_refresh_token',
          refreshToken
        )
      }

      if (data.user) {
        localStorage.setItem(
          'fitzone_user',
          JSON.stringify(data.user)
        )
      }

      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)

      setError(
        error.message ||
          'Unable to sign in. Please try again.'
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
            Continue your
            <br />
            <span>fitness journey.</span>
          </h1>

          <p>
            Sign in to access your workouts, goals,
            progress, personalized plans, and AI-powered
            fitness tools.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Sign in</h2>

            <p>
              Enter your details to continue.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
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

            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">
              Create account
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Login