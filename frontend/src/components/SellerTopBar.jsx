import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api'
import SellerChatSidebar from './SellerChatSidebar.jsx'

export default function SellerTopBar() {
  const { user, logout, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)
  const [q, setQ] = useState('')
  const [counts, setCounts] = useState({ listings: 0, inquiries: 0, media: 0 })
  const fileRef = useRef(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [])

  // Unread count polling for owner
  useEffect(() => {
    let timer
    async function load(){
      try{
        const ownerId = user?.id || user?._id
        if (!ownerId) { setUnread(0); return }
        const items = await api.getInquiries(ownerId)
        const total = (items||[]).reduce((sum, it)=> sum + Number(it.ownerUnreadCount||0), 0)
        setUnread(total)
      } catch {}
    }
    load()
    timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [user?.id, user?._id])

  // Apply theme to document
  useEffect(() => {
    try {
      const root = document.documentElement
      if (theme === 'system') {
        root.removeAttribute('data-theme')
        root.style.colorScheme = ''
      } else {
        root.setAttribute('data-theme', theme)
        root.style.colorScheme = theme
      }
      localStorage.setItem('theme', theme)
    } catch {}
  }, [theme])

  // Load quick stats for dropdown
  useEffect(() => {
    let ignore = false
    async function loadCounts(){
      try{
        const ownerId = user?.id || user?._id
        if (!ownerId) { if(!ignore) setCounts({ listings: 0, inquiries: 0, media: 0 }); return }
        const [props, inqs, media] = await Promise.all([
          api.getPropertiesByOwner(ownerId).catch(()=>[]),
          api.getOwnerInquiries(ownerId).catch(()=>[]),
          api.getMedia(ownerId).catch(()=>[]),
        ])
        if (!ignore) setCounts({ listings: (props||[]).length, inquiries: (inqs||[]).length, media: (media||[]).length })
      } catch {}
    }
    loadCounts()
    // refresh periodically while menu is open
    const t = setInterval(loadCounts, 30000)
    return () => { ignore = true; clearInterval(t) }
  }, [user?.id, user?._id])

  function handleSignOut() {
    logout()
    navigate('/login', { replace: true })
  }

  function onSubmit(e){
    e.preventDefault()
    const query = (q||'').trim()
    const path = String(location.pathname||'')
    if (path.startsWith('/dashboard/seller')){
      window.dispatchEvent(new CustomEvent('seller:search', { detail: { q: query } }))
    } else {
      navigate(query ? `/?q=${encodeURIComponent(query)}` : '/', { replace: false })
    }
  }

  const name = user?.name || 'Seller'
  const email = user?.email || ''
  const role = (user?.role || 'seller').toUpperCase()
  const avatarUrl = user?.profileImageUrl || ''

  async function onPickAvatar(e){
    try{
      const files = Array.from(e.target.files || [])
      if (!files.length) return
      const res = await api.uploadImages(files)
      const url = Array.isArray(res?.urls) ? res.urls[0] : ''
      if (url) {
        const next = { ...(user||{}), profileImageUrl: url }
        // update auth context so UI refreshes everywhere
        login(next, localStorage.getItem('auth:token') || '')
      }
    } finally {
      e.target.value = ''
    }
  }

  function removeAvatar(){
    const next = { ...(user||{}) }
    delete next.profileImageUrl
    login(next, localStorage.getItem('auth:token') || '')
  }

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 15, backdropFilter: 'saturate(180%) blur(6px)', background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid #eee' }}>
      <div className="topbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="only-mobile"
            aria-label="Open menu"
            title="Open menu"
            onClick={() => window.dispatchEvent(new CustomEvent('seller:menu'))}
            style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff' }}
          >☰</button>
          <span style={{ fontSize: 20 }}>🏠</span>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Owner Panel</div>
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
          <div style={{ position:'relative' }}>
            <button aria-label="Open chat" title="Messages" onClick={()=>setChatOpen(true)} style={{ width:36, height:36, borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer' }}>💬</button>
            {unread > 0 && (
              <span style={{ position:'absolute', top:-6, right:-6, background:'#ef4444', color:'#fff', borderRadius:999, fontSize:11, padding:'2px 6px', border:'2px solid #fff' }}>{unread>99?'99+':unread}</span>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#6b7280', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: 20 }}>{role}</span>
          <button onClick={() => setOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6, borderRadius: 999, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
            {avatarUrl ? (
              <img alt="avatar" src={avatarUrl} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#111827', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14 }}>
                {name?.[0]?.toUpperCase() || 'S'}
              </div>
            )}
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
                {/* Quick stats */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginTop:10 }}>
                  <Stat label="Listings" value={counts.listings} />
                  <Stat label="Inquiries" value={counts.inquiries} />
                  <Stat label="Media" value={counts.media} />
                </div>
              </div>
              <div style={{ display: 'grid' }}>
                <div style={{ padding: '8px 12px', display:'grid', gap:8 }}>
                  <div style={{ fontSize:12, color:'#6b7280' }}>Appearance</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>setTheme('light')} style={{ ...chipStyle, ...(theme==='light'? chipActiveStyle:{} ) }}>Light</button>
                    <button onClick={()=>setTheme('dark')} style={{ ...chipStyle, ...(theme==='dark'? chipActiveStyle:{} ) }}>Dark</button>
                    <button onClick={()=>setTheme('system')} style={{ ...chipStyle, ...(theme==='system'? chipActiveStyle:{} ) }}>System</button>
                  </div>
                </div>
                <div style={{ padding: '8px 12px', borderTop:'1px solid #f3f4f6', display:'grid', gap:8 }}>
                  <div style={{ fontSize:12, color:'#6b7280' }}>Avatar</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>fileRef.current?.click()} style={itemButtonStyle}>Change</button>
                    {avatarUrl && <button onClick={removeAvatar} style={{ ...itemButtonStyle, color:'#b91c1c', borderColor:'#ef4444' }}>Remove</button>}
                    <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onPickAvatar} />
                  </div>
                </div>
                <button onClick={handleSignOut} style={{ ...itemStyle, color: '#b91c1c' }}>Sign out</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {chatOpen && <SellerChatSidebar open={chatOpen} onClose={()=>setChatOpen(false)} />}
    </div>
  )
}

const itemStyle = { textAlign: 'left', padding: '10px 12px', background: '#fff', border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }

// Small stat pill used in the dropdown header
function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center', border: '1px solid #eef2f7', borderRadius: 10, padding: 8, background: '#fafafa' }}>
      <div style={{ fontWeight: 800, fontSize: 16 }}>{Number(value || 0)}</div>
      <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
    </div>
  )
}

// Styles for theme chips and small buttons inside dropdown sections
const chipStyle = { padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 999, background: '#fff', cursor: 'pointer', fontSize: 12 }
const chipActiveStyle = { background: '#111827', color: '#fff', borderColor: '#111827' }
const itemButtonStyle = { padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }
