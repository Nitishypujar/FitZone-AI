import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api/client'

function maskEmail(email) {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return email
  if (localPart.length <= 2) return `${localPart[0] || ''}***@${domain}`
  return `${localPart.slice(0, 2)}***@${domain}`
}

function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationState, setVerificationState] = useState('idle')
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    const confirmed = searchParams.get('confirmed') === '1'
    const pending = sessionStorage.getItem('fitzone_verification_email')

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const errorCode = hashParams.get('error_code') || searchParams.get('error_code')
    const authError = hashParams.get('error') || searchParams.get('error')

    if (confirmed) {
      setVerificationState('confirmed')
      setError('')
      setResendMessage('')
      sessionStorage.removeItem('fitzone_verification_email')
      window.history.replaceState({}, '', '/register')
      return
    }

    if (errorCode === 'otp_expired' || authError === 'access_denied') {
      setVerificationState('expired')
      if (pending) setVerificationEmail(pending)
      setError('')
      setResendMessage('')
      window.history.replaceState({}, '', '/register')
      return
    }

    if (pending) {
      setVerificationEmail(pending)
      setVerificationState('pending')
    }
  }, [searchParams])

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
    setResendMessage('')

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
        sessionStorage.removeItem('fitzone_verification_email')
        navigate('/dashboard', { replace: true })
        return
      }

      sessionStorage.setItem('fitzone_verification_email', email)
      setVerificationEmail(email)
      setVerificationState('pending')
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

  async function handleResend() {
    if (!verificationEmail) {
      setVerificationState('idle')
      return
    }

    setResending(true)
    setError('')
    setResendMessage('')

    try {
      const data = await api.post(
        '/api/register/resend-confirmation',
        { email: verificationEmail },
        { auth: false },
      )
      setResendMessage(data.message || 'A new confirmation email has been sent.')
      setVerificationState('pending')
    } catch (resendError) {
      console.error('Confirmation resend error:', resendError)
      setError(resendError.message || 'Unable to resend the confirmation email.')
    } finally {
      setResending(false)
    }
  }

  function startOver() {
    sessionStorage.removeItem('fitzone_verification_email')
    setVerificationState('idle')
    setVerificationEmail('')
    setResendMessage('')
    setError('')
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
            Create your FitZone AI account and get ready to track your workouts,
            goals, progress, and personalized fitness journey.
          </p>
        </div>

        <div className="auth-card">
          {verificationState === 'confirmed' ? (
            <div className="verification-state">
              <span className="verification-icon">✓</span>
              <p className="eyebrow">EMAIL VERIFIED</p>
              <h2>Your email is confirmed.</h2>
              <p>
                Your FitZone AI account is ready. Sign in with your password to
                continue to your fitness dashboard.
              </p>
              <Link to="/login" className="primary-button auth-submit">
                Continue to Sign In
              </Link>
            </div>
          ) : verificationState === 'pending' || verificationState === 'expired' ? (
            <div className="verification-state">
              <span className="verification-icon">✉</span>
              <p className="eyebrow">
                {verificationState === 'expired' ? 'LINK EXPIRED' : 'VERIFY YOUR EMAIL'}
              </p>
              <h2>
                {verificationState === 'expired'
                  ? 'That confirmation link has expired.'
                  : 'Check your inbox.'}
              </h2>
              <p>
                {verificationState === 'expired'
                  ? 'Request a fresh confirmation link below. We will keep you on this page so the process stays simple and secure.'
                  : 'We sent a confirmation link to your email. Open it to verify your account, then return here to sign in.'}
              </p>

              {verificationEmail && (
                <div className="verification-email">
                  {maskEmail(verificationEmail)}
                </div>
              )}

              {error && <p className="auth-error">{error}</p>}
              {resendMessage && <p className="auth-success">{resendMessage}</p>}

              <button
                type="button"
                className="primary-button auth-submit"
                onClick={handleResend}
                disabled={resending || !verificationEmail}
              >
                {resending ? 'Sending confirmation...' : 'Resend confirmation email'}
              </button>

              <button type="button" className="auth-text-button" onClick={startOver}>
                Use a different email
              </button>

              <p className="auth-switch">
                Already verified? <Link to="/login">Sign in</Link>
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default Register
