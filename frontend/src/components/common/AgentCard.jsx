import { Link } from 'react-router-dom'

export default function AgentCard({ agent }) {
  const a = agent
  return (
    <article style={{ border: '1px solid #eee', borderRadius: 10, padding: 16, background: '#fff' }}>
      <div style={{ background: '#e5e7eb', height: 120, borderRadius: 8, marginBottom: 8 }} />
      <div style={{ fontWeight: 700 }}>{a.name || 'Agent'}</div>
      {a.email && <div style={{ color: '#374151' }}>{a.email}</div>}
      {a.phone && <div style={{ color: '#374151' }}>{a.phone}</div>}
      <div style={{ color: '#6b7280' }}>Properties: {a.propertiesCount ?? a.count ?? '—'}</div>
      <Link to={`/agents/${a.id || a._id || '1'}`} style={{
        display: 'inline-block', marginTop: 8, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6
      }}>View Profile</Link>
    </article>
  )
}
