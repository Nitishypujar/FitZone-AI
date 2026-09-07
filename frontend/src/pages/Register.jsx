import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('Please fill in all fields.')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5000/api/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Registration failed.'
        )
      }

      // If Supabase returned a session immediately,
      // store the authentication tokens.
      if (data.session?.access_token) {
        localStorage.setItem(
          'fitzone_access_token',
          data.session.access_token
        )
      }

      if (data.session?.refresh_token) {
        localStorage.setItem(
          'fitzone_refresh_token',
          data.session.refresh_token
        )
      }

      if (data.user) {
        localStorage.setItem(
          'fitzone_user',
          JSON.stringify(data.user)
        )
      }

      navigate('/login')
    } catch (error) {
      console.error('Registration error:', error)

      setError(
        error.message ||
          'Unable to create your account. Please try again.'
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

          <p className="eyebrow">START YOUR JOURNEY</p>

          <h1>
            Build a better
            <br />
            <span>fitness routine.</span>
          </h1>

          <p>
            Create your FitZone AI account and get ready to
            track your workouts, goals, progress, and
            personalized fitness journey.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Create account</h2>

            <p>Set up your account to get started.</p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label>
              Full name

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>

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
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </label>

            <label>
              Confirm password

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                autoComplete="new-password"
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
                ? 'Creating account...'
                : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Register