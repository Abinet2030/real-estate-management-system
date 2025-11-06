const agents = [
  { id: 'a-1', name: 'Liya Solomon', rating: 4.9, email: 'liya@example.com' },
  { id: 'a-2', name: 'Abel Mekonnen', rating: 4.8, email: 'abel@example.com' },
  { id: 'a-3', name: 'Mahi Kebede', rating: 4.7, email: 'mahi@example.com' },
]

function Stars({ value = 0 }) {
  // Round to nearest half for display, then render full/empty stars (basic visual)
  const rounded = Math.round(value * 2) / 2
  const full = Math.floor(rounded)
  const half = rounded - full === 0.5 ? 1 : 0
  const empty = 5 - full - half
  const starStyle = { color: '#f59e0b', marginRight: 2 }
  const mutedStyle = { color: '#e5e7eb', marginRight: 2 }
  return (
    <span aria-label={`rating ${value} out of 5`} title={`${value.toFixed(1)} / 5`} style={{ display: 'inline-flex', alignItems: 'center' }}>
      {Array.from({ length: full }).map((_, i) => (<span key={`f-${i}`} style={starStyle}>★</span>))}
      {half === 1 ? (<span key="half" style={starStyle}>★</span>) : null}
      {Array.from({ length: empty }).map((_, i) => (<span key={`e-${i}`} style={mutedStyle}>☆</span>))}
      <span style={{ marginLeft: 6, color: '#6b7280', fontSize: 12 }}>{value.toFixed(1)}</span>
    </span>
  )
}

export default function TopAgents() {
  return (
    <section id="agents" style={{ padding: '32px 16px', background: '#f9fafb' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 16 }}>Top Agents</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {agents.map((a) => {
            const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=111827&color=fff&size=240`
            return (
              <article key={a.id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 16, background: '#fff' }}>
                {/* cover / avatar */}
                <div style={{ position:'relative', marginBottom: 12 }}>
                  <div style={{ background: '#e5e7eb', height: 120, borderRadius: 8 }} />
                  <img
                    src={avatar}
                    alt={a.name}
                    style={{ position:'absolute', left: 12, top: 12, width: 56, height: 56, borderRadius: '50%', border: '2px solid #fff', objectFit:'cover', boxShadow:'0 4px 14px rgba(0,0,0,0.15)' }}
                    onError={(e)=>{ e.currentTarget.style.display='none' }}
                  />
                </div>
                {/* profile row */}
                <div style={{ display:'grid', gap: 4 }}>
                  <div style={{ fontWeight: 800 }}>{a.name}</div>
                  <div style={{ color:'#6b7280', fontSize: 13 }}>{a.email}</div>
                  <div style={{ marginTop: 2 }}><Stars value={a.rating} /></div>
                </div>
                <a href={`/agents/${a.id}`} style={{ display:'inline-block', marginTop: 10, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, textDecoration:'none' }}>View Profile</a>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
