import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../api/client'

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
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const email = formData.email.trim().toLowerCase()

    if (!formData.name.trim() || !email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (formData.password.length > 128) {
      setError('Password must be 128 characters or fewer.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const data = await api.post(
        '/api/register',
        {
          full_name: formData.name.trim(),
          email,
          password: formData.password,
        },
        { auth: false },
      )

      if (data.session?.access_token) {
        localStorage.setItem('fitzone_access_token', data.session.access_token)
      }

      if (data.session?.refresh_token) {
        localStorage.setItem('fitzone_refresh_token', data.session.refresh_token)
      }

      if (data.user) {
        localStorage.setItem('fitzone_user', JSON.stringify(data.user))
      }

      if (data.session?.access_token) {
        navigate('/dashboard', { replace: true })
        return
      }

      setError('Account created. Please sign in to continue. If Supabase email confirmation is enabled again, complete that step before signing in.')
    } catch (registrationError) {
      console.error('Registration error:', registrationError)
      setError(
        registrationError.message ||
          'Unable to create your account. Please try again.',
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
            <img src="/fitzone-mark.svg" alt="FitZone AI" className="brand-mark-image" />
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
            Create your FitZone AI account and get ready to track your workouts,
            goals, progress, and personalized fitness journey.
          </p>
        </div>

        <div className="auth-card">
            <div className="auth-card-header">
                <h2>Create account</h2>
                <p>Set up your account to get started.</p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                  Full name
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    autoComplete="name"
                    maxLength={120}
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
                    maxLength={254}
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
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
                    minLength={8}
                    maxLength={128}
                  />
                </label>

                {error && <p className="auth-error">{error}</p>}

                <button
                  type="submit"
                  className="primary-button auth-submit"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <div className="auth-divider">
                <span>OR</span>
              </div>

              <p className="auth-switch">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
        </div>
      </section>
    </main>
  )
}

export default Register
