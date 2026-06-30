import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'

export default function PokemonCollection() {
  const [sets, setSets] = useState([])
  const [owned, setOwned] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      apiFetch('/api/pokemon/sets').then(r => r.json()),
      apiFetch('/api/pokemon/owned').then(r => r.json()),
    ])
      .then(([setsData, ownedData]) => {
        setSets(Array.isArray(setsData) ? setsData : [])
        setOwned(Array.isArray(ownedData) ? ownedData : [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function ownedCountForSet(setId) {
    return owned.filter(r => r.items?.set_name === setId).length
  }

  const filtered = sets.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  )

  if (loading) return <div className="page"><p className="page-sub">Loading sets…</p></div>
  if (error)   return <div className="page"><p className="fetch-error">Error: {error}</p></div>

  return (
    <div className="page">
      <h1 className="page-title">Pokémon Cards</h1>
      <p className="page-sub">{sets.length} sets</p>

      <input
        className="search-input"
        type="text"
        placeholder="Search sets…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <div className="set-grid set-grid-top">
        {filtered.map((set) => {
          const count = ownedCountForSet(set.id)
          const pct   = set.total > 0 ? (count / set.total) * 100 : 0
          return (
            <button
              key={set.id}
              className="set-card"
              onClick={() => navigate(`/pokemon/${set.id}`)}
            >
              {set.logo_url && (
                <img src={set.logo_url} alt={set.name} className="set-logo" />
              )}
              <span className="set-name">{set.name}</span>
              <span className="set-total">{set.series} · {set.total} cards</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="progress-label">{count} / {set.total} owned</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
