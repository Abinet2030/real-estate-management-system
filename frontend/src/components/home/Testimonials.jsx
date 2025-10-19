const testimonials = [
  { id: 1, quote: 'I found my dream home easily using Relstate!', name: 'Sena A.' },
  { id: 2, quote: 'Smooth experience from browsing to closing.', name: 'Yonatan T.' },
]

export default function Testimonials() {
  return (
    <section style={{ padding: '32px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>What Our Clients Say</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {testimonials.map((t) => (
            <blockquote key={t.id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 16, background: '#fff' }}>
              <p style={{ fontStyle: 'italic' }}>
                “{t.quote}”
              </p>
              <footer style={{ marginTop: 8, color: '#6b7280' }}>— {t.name}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
