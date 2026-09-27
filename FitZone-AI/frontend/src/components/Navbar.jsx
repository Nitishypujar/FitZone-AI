import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <img src="/fitzone-mark.svg" alt="FitZone AI" className="brand-mark-image" />

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