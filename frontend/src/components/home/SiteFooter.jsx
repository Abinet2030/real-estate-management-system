import { Link } from 'react-router-dom'

export default function SiteFooter() {
  return (
    <footer style={{ padding: '28px 16px', background: '#f3f4f6' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Relstate</div>
            <div style={{ color: '#6b7280' }}>Your trusted platform to buy, sell, or rent real estate.</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Links</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#111827', display: 'grid', gap: 6 }}>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/help">Help</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Contact</div>
            <div style={{ color: '#374151' }}>hello@relstate.example</div>
            <div style={{ color: '#374151' }}>+251 11 234 5678</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, color: '#6b7280', textAlign: 'center' }}>
          © {new Date().getFullYear()} Relstate. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
