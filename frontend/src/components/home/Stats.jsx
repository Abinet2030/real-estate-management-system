export default function Stats() {
  const items = [
    { label: 'Properties Listed', value: '500+' },
    { label: 'Happy Clients', value: '100+' },
    { label: 'Verified Agents', value: '50+' },
  ]
  return (
    <section style={{ padding: '24px 16px', background: '#111827', color: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        {items.map((i) => (
          <div key={i.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{i.value}</div>
            <div style={{ opacity: 0.9 }}>{i.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
