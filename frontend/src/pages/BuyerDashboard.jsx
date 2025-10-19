import { Link } from 'react-router-dom'

export default function BuyerDashboard() {
  return (
    <section style={{ padding: 16 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 16 }}>
        <h2> Tenant Dashboard</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <Card title="Favorites" desc="Your saved properties for quick access." />
          <Card title="Inquiries" desc="Track messages and visit requests." />
          <Card title="Offers" desc="View submitted offers and statuses." />
          <Card title="Profile" desc="Update your contact info and preferences." />
        </div>
        <div>
          <Link to="/properties" style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}>Browse Properties</Link>
        </div>
      </div>
    </section>
  )
}

function Card({ title, desc }) {
  return (
    <article style={{ border: '1px solid #eee', borderRadius: 10, padding: 16, background: '#fff' }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={{ color: '#6b7280' }}>{desc}</div>
      <button style={{ marginTop: 8, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}>Open</button>
    </article>
  )
}
