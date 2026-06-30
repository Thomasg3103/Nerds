const STATS = [
  { label: 'Pokémon Cards',        value: '—', sub: '0 sets tracked' },
  { label: 'Games',                value: '—', sub: '0 titles owned' },
  { label: 'Est. Collection Value', value: '—', sub: 'eBay pricing — Phase 2' },
]

export default function Dashboard() {
  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Your collection at a glance.</p>

      <div className="stat-grid">
        {STATS.map(({ label, value, sub }) => (
          <div key={label} className="stat-card">
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
            <span className="stat-sub">{sub}</span>
          </div>
        ))}
      </div>

      <div className="info-banner">
        <strong>Phase 1 in progress</strong> — add items to your Pokémon and Games collections to see stats populate here.
      </div>
    </div>
  )
}
