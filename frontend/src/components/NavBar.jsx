import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import ChatSidebar from './ChatSidebar.jsx'
import DirectoryMenu from './DirectoryMenu.jsx'
import api from '../services/api'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  // Fetch unread count for buyers
  useEffect(() => {
    let timer
    async function load() {
      try {
        if (!user?.email) { setUnread(0); return }
        const items = await api.getBuyerInquiries(user.email)
        const total = (items || []).reduce((sum, it) => sum + (Number(it.buyerUnreadCount || 0)), 0)
        setUnread(total)
      } catch {
        // ignore
      }
    }
    load()
    // poll every 30s
    timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [user?.email])
  
  function handleSignOut(){
    logout()
    navigate('/')
  }

  return (
    <header className="navbar" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'saturate(180%) blur(6px)', borderBottom: '1px solid #eef2f7', boxShadow: '0 6px 20px rgba(0,0,0,0.05)' }}>
      <nav className="navbar-inner" style={{ padding: '12px 16px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#222' }}>🏡 Realstate</Link>
        </div>

        <div className="nav-links">
          <Link to="/" style={{ padding:'6px 10px', borderRadius:8, textDecoration:'none', color:'#334155' }}>Home</Link>
          {String(user?.role).toLowerCase() === 'buyer' ? (
            <DirectoryMenu />
          ) : (
            <Link to="/agents" style={{ padding:'6px 10px', borderRadius:8, textDecoration:'none', color:'#334155' }}>Agents</Link>
          )}
          <Link to="/about" style={{ padding:'6px 10px', borderRadius:8, textDecoration:'none', color:'#334155' }}>About</Link>
          <Link to="/contact" style={{ padding:'6px 10px', borderRadius:8, textDecoration:'none', color:'#334155' }}>Contact</Link>
          {String(user?.role).toLowerCase() === 'agent' && (
            <Link to="/agent/listings" style={{ padding:'6px 10px', borderRadius:8, textDecoration:'none', color:'#111827', fontWeight:600 }}>My Listings</Link>
          )}
          {String(user?.role).toLowerCase() === 'agent' && (
            <Link to="/agent/add" style={{ padding:'6px 12px', borderRadius:8, textDecoration:'none', background:'#111827', color:'#fff', fontWeight:600 }}>Add Property</Link>
          )}
        </div>

        <div className="nav-actions">
          <input
            type="search"
            placeholder="Search location, city..."
            style={{ padding: '10px 14px', border: '1px solid #e5e7eb', background:'#f8fafc', borderRadius: 999, width: 220, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          />
          {user && (
            <div style={{ position:'relative' }}>
              <button aria-label="Open chat" title="Messages" onClick={()=>setChatOpen(true)} style={{ width:36, height:36, borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer' }}>💬</button>
              {unread > 0 && (
                <span style={{ position:'absolute', top:-6, right:-6, background:'#ef4444', color:'#fff', borderRadius:999, fontSize:11, padding:'2px 6px', border:'2px solid #fff' }}>{unread > 99 ? '99+' : unread}</span>
              )}
            </div>
          )}
          {!user ? (
            <Link to="/login" style={{ padding: '8px 12px', border: '1px solid #111827', background:'#111827', color:'#fff', borderRadius: 8, textDecoration:'none' }}>Login</Link>
          ) : (
            <div style={{ position: 'relative' }}>
              <details>
                <summary style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#111827', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14 }}>
                  </div>
                  <span style={{ fontSize: 14 }}>{user.name || user.email}</span>
                </summary>
                <div style={{ position: 'absolute', right: 0, marginTop: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', minWidth: 180, padding: 8 }}>
                  <Link to="/dashboard" style={{ display: 'block', padding: '8px 10px', borderRadius: 6 }}>Profile</Link>
                  {(['seller','admin'].includes((user.role||'').toLowerCase())) && (
                    <Link to={`/dashboard/${(user.role||'').toLowerCase()}`} style={{ display: 'block', padding: '8px 10px', borderRadius: 6 }}>Dashboard</Link>
                  )}
                  <button onClick={handleSignOut} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#b91c1c' }}>Sign out</button>
                </div>
              </details>
            </div>
          )}
        </div>

        <button className="hamburger" onClick={()=> setMenuOpen(!menuOpen)} aria-label="Open menu">☰</button>
      </nav>
      {/* Mobile panel */}
      <div className={`mobile-panel ${menuOpen ? 'open' : ''}`}>
        <div className="nav-links" style={{ display: 'grid' }}>
          <Link to="/" onClick={()=>setMenuOpen(false)} style={{ padding:'8px 10px' }}>Home</Link>
          {String(user?.role).toLowerCase() === 'buyer' ? (
            <DirectoryMenu />
          ) : (
            <Link to="/agents" onClick={()=>setMenuOpen(false)} style={{ padding:'8px 10px' }}>Agents</Link>
          )}
          <Link to="/about" onClick={()=>setMenuOpen(false)} style={{ padding:'8px 10px' }}>About</Link>
          <Link to="/contact" onClick={()=>setMenuOpen(false)} style={{ padding:'8px 10px' }}>Contact</Link>
          {String(user?.role).toLowerCase() === 'agent' && (
            <Link to="/agent/listings" onClick={()=>setMenuOpen(false)} style={{ padding:'8px 10px' }}>My Listings</Link>
          )}
          {String(user?.role).toLowerCase() === 'agent' && (
            <Link to="/agent/add" onClick={()=>setMenuOpen(false)} style={{ padding:'8px 10px' }}>Add Property</Link>
          )}
          {!user ? (
            <Link to="/login" onClick={()=>setMenuOpen(false)} style={{ padding:'8px 10px' }}>Login</Link>
          ) : (
            <>
              <Link to="/dashboard" onClick={()=>setMenuOpen(false)} style={{ padding:'8px 10px' }}>Profile</Link>
              {(['seller','admin'].includes((user.role||'').toLowerCase())) && (
                <Link to={`/dashboard/${(user.role||'').toLowerCase()}`} onClick={()=>setMenuOpen(false)} style={{ padding:'8px 10px' }}>Dashboard</Link>
              )}
              <button onClick={()=>{ setMenuOpen(false); handleSignOut() }} style={{ textAlign:'left', padding:'8px 10px', background:'transparent', border:'1px solid #ef4444', borderRadius:8, color:'#b91c1c' }}>Sign out</button>
            </>
          )}
        </div>
      </div>
      {chatOpen && <ChatSidebar open={chatOpen} onClose={()=>setChatOpen(false)} />}
    </header>
  )
}
