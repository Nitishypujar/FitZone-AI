import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api/client'

function ProtectedRoute() {
  const location = useLocation()
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let active = true

    async function verifySession() {
      const token = localStorage.getItem('fitzone_access_token')

      if (!token) {
        if (active) setStatus('unauthenticated')
        return
      }

      try {
        await api.get('/api/auth/session')
        if (active) setStatus('authenticated')
      } catch {
        if (active) setStatus('unauthenticated')
      }
    }

    const handleAuthChange = () => {
      verifySession()
    }

    window.addEventListener('fitzone-auth-change', handleAuthChange)
    window.addEventListener('storage', handleAuthChange)
    verifySession()

    return () => {
      active = false
      window.removeEventListener('fitzone-auth-change', handleAuthChange)
      window.removeEventListener('storage', handleAuthChange)
    }
  }, [])

  if (status === 'checking') {
    return (
      <main className="auth-page" aria-live="polite">
        <section className="auth-card" style={{ maxWidth: '520px', margin: '10vh auto' }}>
          <p className="eyebrow">SECURE SESSION</p>
          <h1>Checking your session.</h1>
          <p className="auth-card-header-text">
            FitZone AI is verifying your authentication before loading private data.
          </p>
        </section>
      </main>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default ProtectedRoute
