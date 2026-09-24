import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'

function DashboardLayout() {
  const navigate = useNavigate()
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
    {
      label: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'My Workout', path: '/workout' },
        { name: 'AI Plan', path: '/ai-plan' },
      ],
    },
    {
      label: 'TRACK',
      items: [
        { name: 'Progress', path: '/progress' },
        { name: 'Nutrition', path: '/nutrition' },
        { name: 'Goals', path: '/goals' },
      ],
    },
    {
      label: 'PERSONAL',
      items: [
        { name: 'AI Assistant', path: '/assistant' },
        { name: 'Profile', path: '/profile' },
      ],
    },
  ]

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">
          <span className="brand-mark">F</span>

          <span className="brand-name">
            FitZone<span>AI</span>
          </span>
        </Link>

        <nav className="dashboard-nav">
          {navigation.map((section) => (
            <div className="dashboard-nav-section" key={section.label}>
              <span className="dashboard-nav-label">{section.label}</span>

              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `dashboard-nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="nav-link-indicator"></span>
                  {item.name}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="dashboard-sidebar-bottom">
          <Link to="/" className="back-to-site">
            ← Back to website
          </Link>

          <button type="button" className="dashboard-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-topbar-label">FITZONE AI</span>
          </div>

          <div className="dashboard-user">
            <div className="user-avatar">{avatar}</div>

            <div className="user-info">
              <strong>{displayName}</strong>
              <span>Fitness Member</span>
            </div>
          </div>
        </header>

        <div className="dashboard-outlet">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout