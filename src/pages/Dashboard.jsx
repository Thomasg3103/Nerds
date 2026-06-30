import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    apiFetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const cards = [
    {
      label: 'Pokémon Cards',
      value: stats ? stats.pokemon : '—',
      sub:   stats ? `${stats.pokemonSets} set${stats.pokemonSets !== 1 ? 's' : ''} tracked` : '—',
    },
    {
      label: 'Games',
      value: stats ? stats.games : '—',
      sub:   stats ? `${stats.games} title${stats.games !== 1 ? 's' : ''} owned` : '—',
    },
    {
      label: 'Est. Collection Value',
      value: '—',
      sub:   'eBay pricing — Phase 2',
    },
  ]

  const empty = stats && stats.pokemon === 0 && stats.games === 0

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Your collection at a glance.</p>

      <div className="stat-grid">
        {cards.map(({ label, value, sub }) => (
          <div key={label} className="stat-card">
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
            <span className="stat-sub">{sub}</span>
          </div>
        ))}
      </div>

      {empty && (
        <div className="info-banner">
          <strong>Phase 1 in progress</strong> — add items to your Pokémon and Games
          collections to see stats populate here.
        </div>
      )}
    </div>
  )
}
