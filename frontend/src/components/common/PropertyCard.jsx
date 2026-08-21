import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function PropertyCard({ property, agent }) {
  const p = property
  const candidates = imageCandidates(p)
  const [idx, setIdx] = useState(0)
  const coverSrc = candidates[idx] ? toAbsolute(candidates[idx]) : ''
  const agentName = agent?.name || 'A'
  const agentAvatar = agent?.profileImageUrl || agent?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName)}&background=111827&color=fff&size=80`

  return <article className="property-card">
    {coverSrc ? <img className="property-card-image" src={coverSrc} alt={p.title || 'Property'} onError={() => { if (idx < candidates.length - 1) setIdx(idx + 1) }} /> : <div className="property-card-image property-card-placeholder">Image coming soon</div>}
    {agent && <img className="property-agent-avatar" src={agentAvatar} alt={agentName} onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName)}&background=111827&color=fff&size=80` }} />}
    <div className="property-card-body">
      <div className="property-card-topline"><span className="property-type">{p.saleType === 'rent' ? 'For rent' : 'For sale'}</span><div className="property-price">{priceToText(p.price, p.currency)}</div></div>
      <h3>{p.title || 'Property'}</h3>
      <p className="property-location">Location: {locToText(p.location)}</p>
      <p className="property-facts">{descText(p) || 'Property details available on request'}</p>
      <div className="property-card-actions"><Link className="property-details-link" to={`/properties/${p.id || p._id || '1'}`}><span style={{color: '#fff', display: 'inline-block', maxWidth: 'calc(100% - 28px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>View property</span><span aria-hidden="true">→</span></Link></div>
    </div>
  </article>
}

function priceToText(amount, currency) { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(amount || 0) } catch { return `${amount ?? '-'} ${currency || ''}` } }
function locToText(loc = {}) { try { const parts = [loc.address, loc.city, loc.region, loc.country].filter(Boolean); return parts.length ? parts.join(', ') : 'Location available on request' } catch { return 'Location available on request' } }
function descText(p) { const out = []; if (p.type) out.push(String(p.type)); if (p.bedrooms) out.push(`${p.bedrooms} bed`); if (p.bathrooms) out.push(`${p.bathrooms} bath`); if (p.areaSqm) out.push(`${p.areaSqm} sqm`); return out.join(' · ') }
function toAbsolute(u) { try { return new URL(u, window.location.origin).toString() } catch { return u } }
function imageCandidates(p) {
  const out = []
  try {
    const push = (u) => { if (!u) return; const value = typeof u === 'string' ? u : (u.url || u.src); const s = value?.trim(); if (s && !out.includes(s)) out.push(s) }
    if (Array.isArray(p?.images)) p.images.forEach(push)
    if (Array.isArray(p?.allImages)) p.allImages.forEach(push)
    ;['living', 'kitchen', 'bedrooms', 'bathrooms', 'exterior', 'floorplan'].forEach((key) => (p?.galleries?.[key] || []).forEach(push))
    ;[p?.coverImage, p?.coverUrl, p?.image, p?.imageUrl, p?.imageURL].forEach(push)
    ;[p?.imageUrls, p?.photos, p?.media].filter(Array.isArray).forEach((list) => list.forEach(push))
  } catch { /* use empty image state */ }
  return out
}
