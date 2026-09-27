import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api/client'

const icons = {
  Dashboard: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>,
  'My Workout': <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4M8 7v10M16 7v10M19 10v4M8 12h8"/></svg>,
  'AI Plan': <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16z"/></svg>,
  Progress: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16"/><path d="M7 15l4-4 3 2 5-6"/></svg>,
  Nutrition: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4c-2 2-3 4-3 7 0 5 3 8 7 8s7-3 7-8c0-3-1-5-3-7"/><path d="M12 4c1.5 1 2.5 2.5 2.5 4"/></svg>,
  Goals: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M16.5 7.5L21 3"/></svg>,
  'AI Assistant': <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H12l-4.5 4v-4H7.5A2.5 2.5 0 0 1 5 12.5z"/><path d="M9 9h6M9 12h4"/></svg>,
  Profile: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>,
  'Admin Console': <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.6-2.8 7.9-7 10-4.2-2.1-7-5.4-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>,
}

function DashboardLayout() {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    let active = true
    api.get('/api/auth/session')
      .then((response) => {
        if (active) setIsAdmin(Boolean(response?.user?.is_admin))
      })
      .catch(() => {
        if (active) setIsAdmin(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    function closeOnResize() {
      if (window.innerWidth > 850) setMobileOpen(false)
    }
    window.addEventListener('resize', closeOnResize)
    return () => window.removeEventListener('resize', closeOnResize)
  }, [])

  function handleLogout() {
    localStorage.removeItem('fitzone_access_token')
    localStorage.removeItem('fitzone_refresh_token')
    localStorage.removeItem('fitzone_user')
    window.dispatchEvent(new Event('fitzone-auth-change'))
    navigate('/login', { replace: true })
  }

  let storedUser = null
  try {
    storedUser = JSON.parse(localStorage.getItem('fitzone_user') || 'null')
  } catch {
    storedUser = null
  }

  const displayName = storedUser?.user_metadata?.full_name || storedUser?.full_name || storedUser?.email?.split('@')[0] || 'Fitness Member'
  const avatar = displayName.trim().charAt(0).toUpperCase() || 'F'

  const navigation = [
    { label: 'OVERVIEW', items: [{ name: 'Dashboard', path: '/dashboard' }, { name: 'My Workout', path: '/workout' }, { name: 'AI Plan', path: '/ai-plan' }] },
    { label: 'TRACK', items: [{ name: 'Progress', path: '/progress' }, { name: 'Nutrition', path: '/nutrition' }, { name: 'Goals', path: '/goals' }] },
    { label: 'PERSONAL', items: [{ name: 'AI Assistant', path: '/assistant' }, { name: 'Profile', path: '/profile' }] },
    ...(isAdmin ? [{ label: 'OWNER', items: [{ name: 'Admin Console', path: '/admin' }] }] : []),
  ]

  return (
    <div className="dashboard-layout">
      {mobileOpen && <button className="dashboard-sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <aside className={`dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="dashboard-sidebar-head">
          <Link to="/" className="dashboard-brand" onClick={() => setMobileOpen(false)}>
            <img src="/fitzone-mark.svg" alt="FitZone AI" className="dashboard-brand-mark" />
            <span className="brand-name">FitZone<span>AI</span></span>
          </Link>
          <button className="dashboard-sidebar-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation">×</button>
        </div>

        <div className="dashboard-sidebar-tagline">ADAPTIVE FITNESS INTELLIGENCE</div>

        <nav className="dashboard-nav">
          {navigation.map((section) => (
            <div className="dashboard-nav-section" key={section.label}>
              <span className="dashboard-nav-label">{section.label}</span>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `dashboard-nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-link-icon">{icons[item.name]}</span>
                  <span className="nav-link-text">{item.name}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="dashboard-sidebar-bottom">
          <Link to="/" className="back-to-site" onClick={() => setMobileOpen(false)}>
            <span>←</span> Back to website
          </Link>
          <div className="dashboard-member-card">
            <div className="dashboard-member-avatar">{avatar}</div>
            <div><strong>{displayName}</strong><span>Fitness Member</span></div>
          </div>
          <button type="button" className="dashboard-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <button className="dashboard-menu-button" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation">☰</button>
          <div className="dashboard-topbar-brand"><img src="/fitzone-mark.svg" alt="" /><span>FITZONE AI</span></div>
          <div className="dashboard-topbar-actions">
            <Link to="/dashboard" className="dashboard-home-button" aria-label="Go to dashboard home">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/></svg>
              <span>Home</span>
            </Link>
            <div className="dashboard-user">
            <div className="user-avatar">{avatar}</div>
              <div className="user-info"><strong>{displayName}</strong><span>Fitness Member</span></div>
            </div>
          </div>
        </header>
        <div className="dashboard-outlet"><Outlet /></div>
      </div>
    </div>
  )
}

export default DashboardLayout
