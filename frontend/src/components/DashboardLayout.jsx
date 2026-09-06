import { NavLink, Outlet, Link } from 'react-router-dom'

function DashboardLayout() {
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
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-topbar-label">FITZONE AI</span>
          </div>

          <div className="dashboard-user">
            <div className="user-avatar">N</div>

            <div className="user-info">
              <strong>Guest User</strong>
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