const steps = [
  { title: 'Browse properties', desc: 'Find listings that match your needs.', icon: '🔍' },
  { title: 'Contact agent', desc: 'Ask questions or request a visit.', icon: '💬' },
  { title: 'Close the deal', desc: 'Make an offer and finalize.', icon: '🏡' },
]

export default function HowItWorks() {
  return (
    <section style={{ padding: '32px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 16 }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {steps.map((s) => (
            <div key={s.title} style={{ border: '1px solid #eee', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 32 }}>{s.icon}</div>
              <div style={{ fontWeight: 700 }}>{s.title}</div>
              <div style={{ color: '#4b5563' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
