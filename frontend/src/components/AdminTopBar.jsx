import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminTopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [])

  function handleSignOut() {
    logout()
    navigate('/login', { replace: true })
  }

  const name = user?.name || 'Admin'
  const email = user?.email || ''
  const role = (user?.role || '').toUpperCase()

  function onSubmit(e) {
    e.preventDefault()
    const query = (q || '').trim()
    const path = String(location.pathname || '')
    if (path.startsWith('/dashboard/admin')) {
      // Dispatch a custom event for AdminDashboard to handle inline filtering
      window.dispatchEvent(new CustomEvent('admin:search', { detail: { q: query } }))
    } else {
      navigate(query ? `/?q=${encodeURIComponent(query)}` : '/', { replace: false })
    }
  }

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'saturate(180%) blur(6px)', background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid #eee' }}>
      <div className="topbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🛠️</span>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Admin Panel</div>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10 }}>
          <input
            placeholder="Search..."
            value={q}
            onChange={e=>setQ(e.target.value)}
            onKeyDown={(e)=>{ if (e.key==='Escape') setQ('') }}
            style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          />
        </form>

        <div ref={ref} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#6b7280', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: 20 }}>{role || 'ADMIN'}</span>
          <button onClick={() => setOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6, borderRadius: 999, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#111827', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14 }}>
              {name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, lineHeight: 1 }}>{name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{email}</div>
            </div>
          </button>

          {open && (
            <div style={{ position: 'absolute', top: 56, right: 16, width: 280, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ padding: 12, borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: 700 }}>{name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{email}</div>
              </div>
              <div style={{ display: 'grid' }}>
                <button onClick={() => navigate('/dashboard/admin')} style={itemStyle}>Dashboard</button>
                <button onClick={() => navigate('/')} style={itemStyle}>Go to Site</button>
                <button onClick={handleSignOut} style={{ ...itemStyle, color: '#b91c1c' }}>Sign out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

const itemStyle = { textAlign: 'left', padding: '10px 12px', background: '#fff', border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }
