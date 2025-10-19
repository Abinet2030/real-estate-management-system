export default function About() {
  return (
    <main>
      {/* Hero */}
      <section style={{ padding: '32px 16px', background: 'linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)', color: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.9 }}>About Relstate</div>
          <h1 style={{ margin: 0, fontSize: 36 }}>A smarter way to move real estate forward</h1>
          <p style={{ margin: 0, fontSize: 18, opacity: 0.95 }}>
            We streamline the real estate journey with trusted listings, verified partners, and a modern platform that helps buyers, sellers, and agents work confidently.
          </p>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section style={{ padding: '28px 16px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gap: 20 }}>
          <div style={{ display: 'grid', gap: 8, textAlign: 'center' }}>
            <h2 style={{ margin: 0 }}>Our Mission & Vision</h2>
            <p style={{ margin: 0, color: '#64748b' }}>
              We build technology that makes real estate simpler, safer, and more transparent for everyone.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <Card title="Mission" desc="Simplify real estate transactions for everyone through intuitive tools and data-driven guidance." />
            <Card title="Vision" desc="Become Ethiopia’s most trusted real estate platform by aligning market transparency with great user experience." />
            <Card title="Values" desc="Trust, speed, and clarity. We focus on verified information, responsive support, and simple workflows." />
          </div>
        </div>
      </section>

      {/* Why Relstate */}
      <section style={{ padding: '8px 16px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0, textAlign: 'center' }}>Why Relstate</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Feature title="Verified network" desc="Work with vetted agents and quality listings." icon="🛡️" />
            <Feature title="Secure by design" desc="Best practices across auth, data, and payments." icon="🔒" />
            <Feature title="Real-time status" desc="Track progress and updates without guesswork." icon="⏱️" />
            <Feature title="Owner dashboard" desc="Manage listings, media, and offers in one place." icon="📊" />
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section style={{ padding: '8px 16px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gap: 12, border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Stat label="Avg. response time" value="< 24h" />
            <Stat label="Listings uptime" value="99.9%" />
            <Stat label="User satisfaction" value="4.8/5" />
            <Stat label="Tickets resolved" value="Fast" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '28px 16px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 12, textAlign: 'center' }}>
          <h3 style={{ margin: 0 }}>Ready to get started?</h3>
          <p style={{ margin: 0, color: '#64748b' }}>Create an account to list, browse, or manage properties with confidence.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={btnSecondary}>Join as Agent</button>
            <button style={btnPrimary}>Start Listing</button>
          </div>
        </div>
      </section>
    </main>
  )
}

function Card({ title, desc }) {
  return (
    <article style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ color: '#64748b' }}>{desc}</div>
    </article>
  )
}

function Feature({ title, desc, icon = '✨' }) {
  return (
    <article style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff', display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={{ color: '#64748b' }}>{desc}</div>
    </article>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center', border: '1px solid #eef2f7', borderRadius: 12, padding: 12, background: '#fff' }}>
      <div style={{ fontWeight: 800, fontSize: 18 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
    </div>
  )
}

const btnPrimary = { padding: '10px 14px', border: '1px solid #111827', background: '#111827', color: '#fff', borderRadius: 8, cursor: 'pointer' }
const btnSecondary = { padding: '10px 14px', border: '1px solid #e5e7eb', background: '#fff', color: '#111827', borderRadius: 8, cursor: 'pointer' }
