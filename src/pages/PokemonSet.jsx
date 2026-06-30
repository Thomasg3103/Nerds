import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'

const CONDITIONS = ['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged']

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
  const navigate  = useNavigate()

  const [set, setSet]       = useState(null)
  const [cards, setCards]   = useState([])
  const [owned, setOwned]   = useState([])
  const [query, setQuery]   = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  // card waiting for condition pick; null = picker closed
  const [conditionCard, setConditionCard] = useState(null)

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/pokemon/sets/${setId}`).then(r => r.json()),
      apiFetch(`/api/pokemon/sets/${setId}/cards`).then(r => r.json()),
      apiFetch('/api/pokemon/owned').then(r => r.json()),
    ])
      .then(([setData, cardsData, ownedData]) => {
        setSet(setData)
        setCards(sortByNumber(Array.isArray(cardsData) ? cardsData : []))
        setOwned(Array.isArray(ownedData) ? ownedData : [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [setId])

  async function markOwned(card, condition) {
    setConditionCard(null)
    const res = await apiFetch('/api/pokemon/own', {
      method: 'POST',
      body: JSON.stringify({ item_id: card.id, condition_status: condition }),
    })
    const record = await res.json()
    setOwned(prev => [...prev, { ...record, items: card }])
  }

  async function removeOwned(card) {
    await apiFetch(`/api/pokemon/own/${card.id}`, { method: 'DELETE' })
    setOwned(prev => prev.filter(r => r.item_id !== card.id))
  }

  function handleCardClick(card) {
    const isOwned = owned.some(r => r.item_id === card.id)
    if (isOwned) {
      removeOwned(card)
    } else {
      setConditionCard(card)
    }
  }

  const filtered   = cards.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
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
          const isOwned    = owned.some(r => r.item_id === card.id)
          const ownedRecord = owned.find(r => r.item_id === card.id)
          return (
            <button
              key={card.id}
              className={`card-item ${isOwned ? 'owned' : ''}`}
              onClick={() => handleCardClick(card)}
              title={isOwned ? 'Click to remove from collection' : 'Click to add — pick condition'}
            >
              {card.image_url
                ? <img src={card.image_url} alt={card.name} className="card-img" />
                : <div className="card-img-placeholder" />
              }
              <span className="card-name">{card.name}</span>
              <span className="card-number">#{card.metadata?.number}</span>
              {isOwned && (
                <span className="owned-badge">{ownedRecord?.condition_status ?? 'Owned'}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Condition picker modal */}
      {conditionCard && (
        <div className="modal-overlay" onClick={() => setConditionCard(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Mark as Owned</h3>
            <p className="modal-sub">{conditionCard.name} — select condition</p>
            <div className="condition-list">
              {CONDITIONS.map(c => (
                <button
                  key={c}
                  className="condition-btn"
                  onClick={() => markOwned(conditionCard, c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <button className="modal-cancel" onClick={() => setConditionCard(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
