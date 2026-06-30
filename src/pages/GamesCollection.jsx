import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

const STATUSES = ['All', 'Backlog', 'In Progress', 'Complete', 'Platinumed']

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, '-')
}

export default function GamesCollection() {
  const [owned, setOwned]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')

  useEffect(() => {
    apiFetch('/api/games/owned')
      .then(r => r.json())
      .then(data => setOwned(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Debounced live search — waits 400ms after typing stops before hitting RAWG.
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    setSearching(true)
    const timer = setTimeout(() => {
      apiFetch(`/api/games/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => setResults(Array.isArray(data) ? data : []))
        .catch(err => setError(err.message))
        .finally(() => setSearching(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  function isOwned(externalId) {
    return owned.some(r => r.items?.external_id === externalId)
  }

  async function addGame(game) {
    const res    = await apiFetch('/api/games/own', {
      method: 'POST',
      body: JSON.stringify(game),
    })
    const record = await res.json()
    setOwned(prev => [...prev, { ...record, items: { ...game, id: record.item_id } }])
  }

  async function updateStatus(record, status) {
    setOwned(prev => prev.map(r => r.item_id === record.item_id ? { ...r, condition_status: status } : r))
    await apiFetch(`/api/games/own/${record.item_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async function updateHours(record, hours) {
    setOwned(prev => prev.map(r => r.item_id === record.item_id ? { ...r, hours_played: hours } : r))
    await apiFetch(`/api/games/own/${record.item_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ hours_played: hours }),
    })
  }

  async function removeGame(record) {
    await apiFetch(`/api/games/own/${record.item_id}`, { method: 'DELETE' })
    setOwned(prev => prev.filter(r => r.item_id !== record.item_id))
  }

  const visible = owned.filter(r => activeFilter === 'All' || r.condition_status === activeFilter)

  if (loading) return <div className="page"><p className="page-sub">Loading your games…</p></div>

  return (
    <div className="page">
      <h1 className="page-title">Games</h1>
      <p className="page-sub">Track your backlog, progress, and completions.</p>

      {error && <p className="fetch-error">Error: {error}</p>}

      <div className="games-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search for a game to add…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="search-results">
          {searching && <p className="placeholder-note">Searching…</p>}
          {!searching && results.length === 0 && (
            <p className="placeholder-note">No games found.</p>
          )}
          {!searching && results.map((game) => (
            <div key={game.external_id} className="search-result">
              {game.image_url
                ? <img src={game.image_url} alt={game.name} className="search-result-img" />
                : <div className="search-result-img-placeholder" />
              }
              <div className="search-result-info">
                <span className="search-result-name">{game.name}</span>
                <span className="search-result-sub">
                  {game.metadata.released ?? 'Unknown release'} · {game.metadata.platforms.slice(0, 3).join(', ')}
                </span>
              </div>
              <button
                className="add-btn"
                disabled={isOwned(game.external_id)}
                onClick={() => addGame(game)}
              >
                {isOwned(game.external_id) ? 'Added' : '+ Add'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="filter-tabs">
        {STATUSES.map((status) => (
          <button
            key={status}
            className={`filter-tab ${activeFilter === status ? 'active' : ''}`}
            onClick={() => setActiveFilter(status)}
          >
            {status}
            {status !== 'All' && (
              <span className="filter-count">
                {owned.filter(r => r.condition_status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">
          <p>No games {activeFilter !== 'All' ? `in "${activeFilter}"` : 'added yet'}.</p>
          <p className="placeholder-note">Search above to add games to your collection.</p>
        </div>
      ) : (
        <div className="game-grid">
          {visible.map((record) => (
            <div key={record.item_id} className="game-card">
              {record.items?.image_url
                ? <img src={record.items.image_url} alt={record.items.name} className="game-img" />
                : <div className="game-img-placeholder" />
              }
              <div className="game-card-body">
                <span className="game-name">{record.items?.name}</span>
                <select
                  className={`status-select status-${statusClass(record.condition_status)}`}
                  value={record.condition_status}
                  onChange={e => updateStatus(record, e.target.value)}
                >
                  {STATUSES.filter(s => s !== 'All').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <label className="hours-label">
                  Hours played
                  <input
                    type="number"
                    min="0"
                    className="hours-input"
                    value={record.hours_played ?? ''}
                    onChange={e => updateHours(record, e.target.value === '' ? null : Number(e.target.value))}
                  />
                </label>
                <button className="remove-btn" onClick={() => removeGame(record)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
