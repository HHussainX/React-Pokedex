import '../css/Navbar.css'
import { Link, NavLink } from "react-router-dom"

function NavBar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/home" className="brand-link">
          Pokédex
        </Link>
      </div>
      <div className="navbar-links">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/favorites"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Favorites
        </NavLink>
      </div>
    </nav>
  )
}

export default NavBar
