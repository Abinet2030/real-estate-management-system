const agents = [
  { id: 1, name: 'Liya Solomon', rating: 4.9 },
  { id: 2, name: 'Abel Mekonnen', rating: 4.8 },
  { id: 3, name: 'Mahi Kebede', rating: 4.7 },
]

export default function TopAgents() {
  return (
    <section id="agents" style={{ padding: '32px 16px', background: '#f9fafb' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 16 }}>Top Agents</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {agents.map((a) => (
            <article key={a.id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 16, background: '#fff' }}>
              <div style={{ background: '#e5e7eb', height: 120, borderRadius: 8, marginBottom: 8 }} />
              <div style={{ fontWeight: 700 }}>{a.name}</div>
              <div style={{ color: '#6b7280' }}>Rating: {a.rating}</div>
              <button style={{ marginTop: 8, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}>View Profile</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
