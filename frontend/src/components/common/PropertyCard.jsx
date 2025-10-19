import { Link } from 'react-router-dom'
import { useState } from 'react'
import InquiryChatPopup from '../InquiryChatPopup.jsx'

export default function PropertyCard({ property }) {
  const p = property
  const [open, setOpen] = useState(false)
  return (
    <article style={{ border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      <div style={{ background: '#e5e7eb', height: 160 }} />
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
