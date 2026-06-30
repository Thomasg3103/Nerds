import { useState } from 'react'

// Placeholder data — will be replaced by Pokemon TCG API responses in Phase 1 backend.
const PLACEHOLDER_SETS = [
  { id: 'base1', name: 'Base Set',    total: 102 },
  { id: 'gym1',  name: 'Gym Heroes', total: 132 },
  { id: 'neo1',  name: 'Neo Genesis', total: 111 },
]

export default function PokemonCollection() {
  const [selectedSet, setSelectedSet] = useState(null)

  return (
    <div className="page">
      <h1 className="page-title">Pokémon Cards</h1>
      <p className="page-sub">Browse sets and track which cards you own.</p>

      <div className="set-grid">
        {PLACEHOLDER_SETS.map((set) => (
          <button
            key={set.id}
            className={`set-card ${selectedSet?.id === set.id ? 'selected' : ''}`}
            onClick={() => setSelectedSet(set)}
          >
            <span className="set-name">{set.name}</span>
            <span className="set-total">{set.total} cards</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '0%' }} />
            </div>
            <span className="progress-label">0 / {set.total} owned</span>
          </button>
        ))}
      </div>

      {selectedSet && (
        <div className="card-panel">
          <h2>{selectedSet.name}</h2>
          <p className="placeholder-note">
            Card list loads here once the Pokémon TCG API is wired up (Phase 1 backend).
          </p>
        </div>
      )}
    </div>
  )
}
