import { useState } from 'react'

const STATUSES = ['All', 'Backlog', 'In Progress', 'Complete', 'Platinumed']

export default function GamesCollection() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [query, setQuery] = useState('')

  return (
    <div className="page">
      <h1 className="page-title">Games</h1>
      <p className="page-sub">Track your backlog, progress, and completions.</p>

      <div className="games-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search for a game… (IGDB / RAWG integration — Phase 1)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled
        />
      </div>

      <div className="filter-tabs">
        {STATUSES.map((status) => (
          <button
            key={status}
            className={`filter-tab ${activeFilter === status ? 'active' : ''}`}
            onClick={() => setActiveFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="empty-state">
        <p>No games added yet.</p>
        <p className="placeholder-note">
          Search will connect to IGDB or RAWG once the backend is in place.
        </p>
      </div>
    </div>
  )
}
