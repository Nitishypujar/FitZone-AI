import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark">F</span>

        <span className="brand-name">
          FitZone<span>AI</span>
        </span>
      </Link>

      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/services">Services</Link>
        <Link to="/about">About</Link>
        <Link to="/membership">Membership</Link>
        <Link to="/contact">Contact</Link>
      </nav>

      <Link to="/membership" className="nav-button">
        Get Started
      </Link>
    </header>
  )
}

export default Navbar