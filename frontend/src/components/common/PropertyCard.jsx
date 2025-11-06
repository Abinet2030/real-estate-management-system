import { Link } from 'react-router-dom'
import { useState } from 'react'
import InquiryChatPopup from '../InquiryChatPopup.jsx'

export default function PropertyCard({ property, agent }) {
  const p = property
  const [open, setOpen] = useState(false)
  
  const candidates = imageCandidates(p)
  const [idx, setIdx] = useState(0)
  const cover = candidates[idx]
  const coverSrc = cover ? toAbsolute(cover) : ''


  const agentName = agent?.name || 'A'
  const agentAvatar = agent?.profileImageUrl || agent?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName)}&background=111827&color=fff&size=80`

  return (
    <article style={{ border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', background: '#fff', position:'relative' }}>
      {coverSrc ? (
        <img
          src={coverSrc}
          alt={p.title || 'Property'}
          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
          onError={()=>{ if (idx < candidates.length - 1) setIdx(idx + 1) }}
        />
      ) : (
        <div style={{ background: '#e5e7eb', height: 160 }} />
      )}
      {agent && (
        <img
          src={agentAvatar}
          alt={agentName}
          onError={(e)=>{ e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName)}&background=111827&color=fff&size=80` }}
          style={{ position:'absolute', left:10, top:10, width:40, height:40, borderRadius:'50%', border:'2px solid #fff', boxShadow:'0 2px 8px rgba(0,0,0,0.15)', objectFit:'cover' }}
        />
      )}
      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{p.title || 'Property'}</h3>
          <div style={{ color: '#16a34a', fontWeight: 700 }}>{priceToText(p.price, p.currency)}</div>
        </div>
        <div style={{ color: '#6b7280', fontSize: 14 }}>{locToText(p.location)}</div>
        <div style={{ color: '#374151', fontSize: 14 }}>{descText(p)}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems:'center' }}>
          <Link to={`/properties/${p.id || p._id || '1'}`} style={{
            display: 'inline-block', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6
          }}>View Details</Link>
          <button aria-label="Chat with owner" title="Chat with owner" onClick={()=>setOpen(true)} style={{
            width:36, height:36, border: '1px solid #111827', background: '#111827', color: '#fff', borderRadius: 8, cursor:'pointer', display:'grid', placeItems:'center'
          }}>💬</button>
        </div>
      </div>
      {open && <InquiryChatPopup open={open} property={p} onClose={()=>setOpen(false)} />}
    </article>
  )
}

function priceToText(amount, currency){
  try{ return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(amount || 0) } catch { return `${amount ?? '—'} ${currency||''}` }
}
function locToText(loc = {}){
  try{ const parts=[loc.address, loc.city, loc.region, loc.country].filter(Boolean); return parts.length? parts.join(', ') : '—' } catch { return '—' }
}
function descText(p){
  const out=[]
  if (p.type) out.push(String(p.type))
  if (p.bedrooms) out.push(`${p.bedrooms} bed`)
  if (p.bathrooms) out.push(`${p.bathrooms} bath`)
  if (p.areaSqm) out.push(`${p.areaSqm} m²`)
  return out.join(' · ')
}

function toAbsolute(u){ try { return new URL(u, window.location.origin).toString() } catch { return u } }
function imageCandidates(p){
  const out=[]
  try{
    const push = (u)=>{ if(!u) return; if(typeof u==='string'){ const s=u.trim(); if(s && !out.includes(s)) out.push(s) } else if (u.url||u.src){ const s=(u.url||u.src).trim(); if(s && !out.includes(s)) out.push(s) } }
    if (Array.isArray(p?.images)) p.images.forEach(push)
    if (Array.isArray(p?.allImages)) p.allImages.forEach(push)
    const g = p?.galleries || {}
    ;['living','kitchen','bedrooms','bathrooms','exterior','floorplan'].forEach(k=>{ const list = Array.isArray(g[k]) ? g[k] : []; list.forEach(push) })
    ;[p?.coverImage, p?.coverUrl, p?.image, p?.imageUrl, p?.imageURL].forEach(push)
    if (Array.isArray(p?.imageUrls)) p.imageUrls.forEach(push)
    if (Array.isArray(p?.photos)) p.photos.forEach(push)
    if (Array.isArray(p?.media)) p.media.forEach(push)
  }catch{}
  return out
}
