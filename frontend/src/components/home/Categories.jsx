const cats = [
  { key: 'apartments', label: 'Apartments', emoji: '🏢' },
  { key: 'houses', label: 'Houses', emoji: '🏘' },
  { key: 'commercial', label: 'Commercial', emoji: '🏬' },
  { key: 'land', label: 'Land / Plots', emoji: '🌅' },
]

export default function Categories() {
  return (
    <section style={{ padding: '24px 16px', background: '#f9fafb' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 16 }}>Browse by Category</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {cats.map((c) => (
            <a key={c.key} href={`/browse?category=${c.key}`} style={{
              border: '1px solid #eee', borderRadius: 10, padding: 16, background: '#fff', textDecoration: 'none', color: '#111827'
            }}>
              <div style={{ fontSize: 28 }}>{c.emoji}</div>
              <div style={{ fontWeight: 600 }}>{c.label}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Explore {c.label.toLowerCase()}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
