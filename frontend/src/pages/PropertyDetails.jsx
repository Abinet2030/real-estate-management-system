import { useEffect, useState, useCallback } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function PropertyDetails() {
  const { id } = useParams()
  // Normalize id in case a legacy redirect or bad link provided a literal ":id"
  const normalizedId = String(id || '').replace(/^:/, '')
  const location = useLocation()
  const inquiryIdFromState = location?.state?.inquiryId || ''
  const { user } = useAuth()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // inquiry state
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [message, setMessage] = useState('')
  const [inqLoading, setInqLoading] = useState(false)
  const [inqSuccess, setInqSuccess] = useState('')
  // attachments passed via inquiry (when coming from Inquiries → Open property)
  const [convAttachments, setConvAttachments] = useState([])
  // main image index for gallery (must be declared before any early returns)
  const [imgIdx, setImgIdx] = useState(0)
  const [showAllPhotos, setShowAllPhotos] = useState(false)

  const fetchItem = useCallback(async () => {
    let cancelled = false
    setLoading(true)
    setError('')
    try {
      const res = await api.getProperty(normalizedId)
      const data = Array.isArray(res) ? res[0] : (res.data ?? res)
      if (!cancelled) setItem(data)
    } catch (e) {
      console.error('PropertyDetails: failed to load property', { id: normalizedId, error: e?.message || e })
      setError(e.message || 'Failed to load property')
    } finally {
      setLoading(false)
    }
    return () => { cancelled = true }
  }, [normalizedId])

  useEffect(() => {
    // initial load
    fetchItem()
  }, [fetchItem])

  // If navigated here with an inquiry id, load its attachments and show them
  useEffect(() => {
    let cancelled = false
    async function loadInquiry() {
      if (!inquiryIdFromState) { setConvAttachments([]); return }
      try {
        const data = await api.getInquiry(inquiryIdFromState)
        const msgs = Array.isArray(data?.messages) ? data.messages : []
        const urls = []
        msgs.forEach(m => {
          if (Array.isArray(m.attachments)) urls.push(...m.attachments.filter(Boolean))
        })
        if (!cancelled) setConvAttachments(urls)
      } catch {
        if (!cancelled) setConvAttachments([])
      }
    }
    loadInquiry()
    return () => { cancelled = true }
  }, [inquiryIdFromState])

  useEffect(() => {
    if (window.location.hash === '#contact' && !loading) {
      const el = document.getElementById('contact')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        // Focus the first form input after a brief delay
        setTimeout(() => {
          const input = el.querySelector('input[required]')
          if (input) input.focus()
        }, 500)
      }
    }
  }, [loading])

  // Prefill inquiry form if user is logged in
  useEffect(() => {
    if (user && user.name && user.email) {
      setBuyerName(user.name)
      setBuyerEmail(user.email)
    }
  }, [user])

  if (loading) return <section style={{ padding: 16 }}>Loading...</section>
  if (error) return (
    <section style={{ padding: 16 }}>
      <div style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#7f1d1d', borderRadius: 10, padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Failed to load property</div>
        <div style={{ fontSize: 14, marginBottom: 6 }}>{error}</div>
        <div style={{ fontSize: 12, color: '#991b1b', opacity: 0.9 }}>ID: {normalizedId}</div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button onClick={fetchItem} style={{ padding: '8px 12px', border: '1px solid #ef4444', background: '#ef4444', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
          <a href="/properties" style={{ padding: '8px 12px', border: '1px solid #e5e7eb', background: '#fff', color: '#111827', borderRadius: 6 }}>Browse listings</a>
        </div>
      </div>
    </section>
  )
  if (!item) return <section style={{ padding: 16 }}>No property found.</section>

  // derive images list from item
  const imgs = imageCandidates(item)

  return (
    <section style={{ padding: 16 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', position:'relative' }}>
            {imgs.length ? (
              <img src={toAbsolute(imgs[Math.min(imgIdx, imgs.length-1)])} alt={item?.title || 'Property'} style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ background: '#e5e7eb', height: 320 }} />
            )}
            {imgs.length > 1 && (
              <button onClick={()=> setShowAllPhotos(true)} style={{ position:'absolute', right:8, bottom:8, padding:'8px 10px', background:'#111827', color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>
                View all photos ({imgs.length})
              </button>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8, padding: 8 }}>
              {(imgs.length ? imgs : []).map((u, i)=> (
                u ? (
                  <button key={i} onClick={()=> setImgIdx(i)} title="View image" style={{ padding:0, border:'none', background:'transparent', cursor:'pointer' }}>
                    <img src={toAbsolute(u)} alt="thumb" style={{ width:'100%', height: 80, objectFit:'cover', borderRadius:6, border: '1px solid #eee' }} />
                  </button>
                ) : (
                  <div key={i} style={{ background:'#e5e7eb', height:80, borderRadius:6 }} />
                )
              ))}
            </div>
            {convAttachments.length > 0 && (
              <div style={{ padding: 8, borderTop: '1px solid #eee', background: '#fafafa' }}>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Conversation Attachments</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {convAttachments.slice(0, 12).map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noreferrer" title="Open attachment">
                      <img src={u} alt="attachment" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ margin: 0 }}>{item.title || 'Property'}</h2>
            <div style={{ color: '#16a34a', fontWeight: 800, fontSize: 20 }}>{formatCurrency(item.price, item.currency)}</div>
            <div style={{ color: '#6b7280' }}>{formatLocation(item.location)}</div>
            <div style={{ color: '#374151' }}>{String(item.type || '').toUpperCase()} {item.areaSqm ? `· ${item.areaSqm} m²` : ''}</div>
            {/* Specs grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:8, marginTop:8 }}>
              <Spec label="Bedrooms" value={item.bedrooms} />
              <Spec label="Bathrooms" value={item.bathrooms} />
              <Spec label="Area" value={item.areaSqm ? `${item.areaSqm} m²` : '—'} />
              <Spec label="Type" value={String(item.type||'—').toUpperCase()} />
              <Spec label="City" value={item.location?.city || '—'} />
              <Spec label="Region" value={item.location?.region || '—'} />
              <Spec label="Country" value={item.location?.country || '—'} />
              <Spec label="Address" value={item.location?.address || '—'} />
            </div>
            <p>{item.description || 'No description provided.'}</p>
            <div id="contact" style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
              <h3 style={{ marginTop: 0 }}>Contact Owner</h3>
              {inqSuccess && <div style={{ background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0', padding:'8px 10px', borderRadius:8, marginBottom:8 }}>{inqSuccess}</div>}
              <form onSubmit={async (e)=>{
                e.preventDefault()
                setInqSuccess('')
                try{
                  setInqLoading(true)
                  const body = { propertyId: item.id || id, ownerId: item.ownerId, buyerName, buyerEmail, message }
                  if (!body.ownerId) throw new Error('Owner not available for this listing.')
                  await api.createInquiry(body)
                  setInqSuccess('Your message was sent to the owner. They will reply in the Inquiries section.')
                  setMessage('')
                }catch(e2){ setError(e2.message) } finally{ setInqLoading(false) }
              }} style={{ display:'grid', gap:8 }}>
                <div>
                  <label style={{ display:'block', fontSize:13, color:'#374151' }}>Your Name *</label>
                  <input required value={buyerName} onChange={e=>setBuyerName(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:13, color:'#374151' }}>Your Email *</label>
                  <input required type="email" value={buyerEmail} onChange={e=>setBuyerEmail(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:13, color:'#374151' }}>Message</label>
                  <textarea value={message} onChange={e=>setMessage(e.target.value)} style={{ width:'100%', minHeight:80, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }} />
                </div>
                <div>
                  <button disabled={inqLoading} type="submit" style={{ padding:'10px 14px', border:'1px solid #111827', background:'#111827', color:'#fff', borderRadius:6 }}>{inqLoading?'Sending...':'Send Message'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* Room-by-room galleries */}
        {renderGalleries(item?.galleries, imgs, setImgIdx)}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background:'#fff' }}>
          <h3 style={{ marginTop:0 }}>Features</h3>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {(item.features && item.features.length ? item.features : ['Parking','Balcony','Secure Area']).map((f, i)=> (
              <Pill key={`${f}-${i}`} text={f} />
            ))}
          </div>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background:'#fff' }}>
          <h3 style={{ marginTop:0 }}>Agent / Owner</h3>
          <AgentCard agent={item.agent} owner={item.owner} />
        </div>
        <div style={{ height: 300, border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
          <h3>Map</h3>
          <div style={{ background: '#e5e7eb', height: '100%', borderRadius: 8 }} />
        </div>
        {/* Modal: all photos */}
        <PhotosModal open={showAllPhotos} onClose={()=> setShowAllPhotos(false)} images={imgs} onSelect={setImgIdx} />
      </div>
    </section>
  )
}

// Simple modal to show all photos in a grid
function PhotosModal({ open, onClose, images, onSelect }){
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'grid', placeItems:'center', padding:16 }}>
      <div onClick={(e)=> e.stopPropagation()} style={{ width:'min(1100px, 96vw)', maxHeight:'90vh', overflow:'auto', background:'#fff', borderRadius:12, padding:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontWeight:800 }}>All Photos ({images.length})</div>
          <button onClick={onClose} style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:6, padding:'6px 10px', cursor:'pointer' }}>Close</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:10 }}>
          {images.map((u, i)=> (
            <button key={i} onClick={()=> { onSelect?.(i); onClose?.() }} title="Select" style={{ padding:0, border:'none', background:'transparent', cursor:'pointer' }}>
              <img src={toAbsolute(u)} alt={`photo-${i}`} style={{ width:'100%', height:160, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Pill({ text }){
  return <span style={{ padding:'6px 10px', border:'1px solid #cbd5e1', background:'#f8fafc', color:'#111827', borderRadius:999, fontSize:12 }}>{text}</span>
}

function AgentCard({ agent, owner }){
  const name = agent?.name || owner?.name || '—'
  const email = agent?.email || owner?.email || ''
  const phone = agent?.phone || owner?.phone || ''
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:48, height:48, borderRadius:'50%', background:'#111827', color:'#fff', display:'grid', placeItems:'center', fontWeight:700 }}>
        {(name||'—')[0]?.toUpperCase() || '—'}
      </div>
      <div>
        <div style={{ fontWeight:700 }}>{name}</div>
        <div style={{ color:'#6b7280', fontSize:14 }}>{email}</div>
        {phone && <div style={{ color:'#6b7280', fontSize:14 }}>{phone}</div>}
      </div>
    </div>
  )
}
// details helpers
function Spec({ label, value }){
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>
      <div style={{ fontSize:12, color:'#6b7280' }}>{label}</div>
      <div style={{ fontWeight:700 }}>{value ?? '—'}</div>
    </div>
  )
}

function formatCurrency(amount, currency){
  try { return new Intl.NumberFormat(undefined, { style:'currency', currency: currency || 'USD' }).format(Number(amount||0)) } catch { return `${amount ?? ''} ${currency ?? ''}` }
}
function formatLocation(loc = {}){
  try{ const parts = [loc.address, loc.city, loc.region, loc.country].filter(Boolean); return parts.length ? parts.join(', ') : '—' } catch { return '—' }
}

// ---- Helpers (module scope) ----
function imageCandidates(p){
  const out = []
  try{
    const push = (u)=>{ if(!u) return; if(typeof u==='string'){ const s=u.trim(); if(s && !out.includes(s)) out.push(s) } else if (u.url||u.src){ const s=(u.url||u.src).trim(); if(s && !out.includes(s)) out.push(s) } }
    if (Array.isArray(p?.images)) p.images.forEach(push)
    if (Array.isArray(p?.allImages)) p.allImages.forEach(push)
    const g = p?.galleries || {}
    ;['living','kitchen','bedrooms','bathrooms','exterior','floorplan'].forEach(k=>{
      const list = Array.isArray(g[k]) ? g[k] : []
      list.forEach(push)
    })
    ;[p?.coverImage, p?.coverUrl, p?.image, p?.imageUrl, p?.imageURL].forEach(push)
    // Compatibility lists
    if (Array.isArray(p?.imageUrls)) p.imageUrls.forEach(push)
    if (Array.isArray(p?.photos)) p.photos.forEach(push)
    if (Array.isArray(p?.media)) p.media.forEach(push)
  }catch{}
  return out
}

function toAbsolute(u){ try { return new URL(u, window.location.origin).toString() } catch { return u } }

function renderGalleries(galleries, allImgs = [], setImgIdx){
  const map = [
    ['living','Living Room'],
    ['kitchen','Kitchen'],
    ['bedrooms','Bedrooms'],
    ['bathrooms','Bathrooms'],
    ['exterior','Exterior'],
    ['floorplan','Floor Plan'],
  ]
  const sections = map
    .map(([key,label])=>{
      const list = Array.isArray(galleries?.[key]) ? galleries[key].filter(Boolean) : []
      if (list.length === 0) return null
      return (
        <div key={key} style={{ border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>{label}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {list.map((u, i)=> (
              <button key={i} onClick={()=>{ const idx = allImgs.findIndex(x=> String(x||'').trim() === String(u||'').trim()); setImgIdx?.(idx >= 0 ? idx : 0) }} title="View image" style={{ padding:0, border:'none', background:'transparent', cursor:'pointer' }}>
                <img src={u} alt={label} style={{ width:'100%', height:120, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff' }} />
              </button>
            ))}
          </div>
        </div>
      )
    })
    .filter(Boolean)
  if (sections.length === 0) return null
  return (
    <div style={{ display:'grid', gap:12 }}>
      <h3 style={{ margin: 0 }}>Photos by Room</h3>
      {sections}
    </div>
  )
}
