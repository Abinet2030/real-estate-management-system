const cats = [
  // Map to the "type" values used by filters/properties: apartment | house | commercial | land
  { key: 'apartment', label: 'Apartments', emoji: '🏢' },
  { key: 'house', label: 'Houses', emoji: '🏘' },
  { key: 'commercial', label: 'Commercial', emoji: '🏬' },
  { key: 'land', label: 'Land / Plots', emoji: '🌅' },
]

export default function Categories() {
  return (
    <section className="home-section category-section">
      <div className="home-container">
        <div className="section-heading"><div><p>Explore your options</p><h2>Find the space that suits you</h2></div><a href="/properties">View all properties →</a></div>
        <div className="category-grid">
          {cats.map((c) => (
            <a key={c.key} className="category-card" href={`/properties?type=${encodeURIComponent(c.key)}`}>
              <div className="category-icon">{c.emoji}</div><div><strong>{c.label}</strong><span>Explore {c.label.toLowerCase()}</span></div><b>→</b>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
