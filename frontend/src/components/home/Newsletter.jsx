export default function Newsletter() {
  return (
    <section style={{ padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <h3>Subscribe to get updates on new listings</h3>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
          <input type="email" placeholder="you@example.com" style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, minWidth: 240 }} />
          <button style={{ padding: '10px 16px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6 }}>Subscribe</button>
        </div>
      </div>
    </section>
  )
}
