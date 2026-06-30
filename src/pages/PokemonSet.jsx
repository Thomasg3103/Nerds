import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API = 'http://localhost:3001'

// Sort cards numerically by card number (e.g. "1" < "10" < "102").
// Falls back to alphabetic for promo/special numbers like "SWSH001".
function sortByNumber(cards) {
  return [...cards].sort((a, b) => {
    const na = parseInt(a.metadata?.number, 10)
    const nb = parseInt(b.metadata?.number, 10)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return (a.metadata?.number ?? '').localeCompare(b.metadata?.number ?? '')
  })
}

export default function PokemonSet() {
  const { setId } = useParams()
  const navigate = useNavigate()

  const [set, setSet] = useState(null)
  const [cards, setCards] = useState([])
  const [owned, setOwned] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/pokemon/sets/${setId}`).then(r => r.json()),
      fetch(`${API}/api/pokemon/sets/${setId}/cards`).then(r => r.json()),
      fetch(`${API}/api/pokemon/owned`).then(r => r.json()),
    ])
      .then(([setData, cardsData, ownedData]) => {
        setSet(setData)
        setCards(sortByNumber(Array.isArray(cardsData) ? cardsData : []))
        setOwned(Array.isArray(ownedData) ? ownedData : [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [setId])

  async function toggleOwned(card) {
    const existing = owned.find(r => r.item_id === card.id)
    if (existing) {
      await fetch(`${API}/api/pokemon/own/${card.id}`, { method: 'DELETE' })
      setOwned(prev => prev.filter(r => r.item_id !== card.id))
    } else {
      const res = await fetch(`${API}/api/pokemon/own`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: card.id }),
      })
      const record = await res.json()
      setOwned(prev => [...prev, { ...record, items: card }])
    }
  }

  const filtered = cards.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  )

  const ownedCount = owned.filter(r => r.items?.set_name === setId).length

  if (loading) return <div className="page"><p className="page-sub">Loading cards…</p></div>
  if (error)   return <div className="page"><p className="fetch-error">Error: {error}</p></div>

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/pokemon')}>← Sets</button>

      <div className="set-page-header">
        {set?.logo_url && <img src={set.logo_url} alt={set.name} className="set-logo-lg" />}
        <div>
          <h1 className="page-title">{set?.name}</h1>
          <p className="page-sub">{set?.series} · {ownedCount} / {cards.length} owned</p>
          <div className="progress-bar set-progress">
            <div
              className="progress-fill"
              style={{ width: cards.length > 0 ? `${(ownedCount / cards.length) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search cards…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <div className="card-grid card-grid-top">
        {filtered.map((card) => {
          const isOwned = owned.some(r => r.item_id === card.id)
          return (
            <button
              key={card.id}
              className={`card-item ${isOwned ? 'owned' : ''}`}
              onClick={() => toggleOwned(card)}
              title={isOwned ? 'Click to remove from collection' : 'Click to mark as owned'}
            >
              {card.image_url
                ? <img src={card.image_url} alt={card.name} className="card-img" />
                : <div className="card-img-placeholder" />
              }
              <span className="card-name">{card.name}</span>
              <span className="card-number">#{card.metadata?.number}</span>
              {isOwned && <span className="owned-badge">Owned</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
