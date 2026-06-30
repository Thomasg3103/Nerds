import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',        label: 'Dashboard', icon: '▪' },
  { to: '/pokemon', label: 'Pokémon',   icon: '◆' },
  { to: '/games',   label: 'Games',     icon: '▶' },
]

export default function Navbar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">CI</span>
        <span className="sidebar-title">Collection<br />Intelligence</span>
      </div>
      <ul className="sidebar-links">
        {links.map(({ to, label, icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
