import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../../services/api'
import InquiryChatPopup from '../InquiryChatPopup.jsx'

// Demo data used in development when API returns no published properties
const DEMO_FEATURED = [
  {
    id: 'demo-1',
    title: 'Modern Family House',
    description: 'Spacious 4 bed family home with garden',
    price: 350000,
    currency: 'USD',
    type: 'house',
    bedrooms: 4,
    bathrooms: 3,
    areaSqm: 220,
    location: { city: 'Addis Ababa', region: 'Addis Ababa', country: 'Ethiopia' },
    images: [
      'https://images.unsplash.com/photo-1560185008-b033106af2f1?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1575517111478-7f6dbfbfb9d1?q=80&w=800&auto=format&fit=crop',
    ],
    status: 'published',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: 'City View Apartment',
    description: 'Sunny 2 bed apartment with great views',
    price: 1200,
    currency: 'USD',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 85,
    location: { city: 'Nairobi', region: 'Nairobi', country: 'Kenya' },
    images: [
      'https://images.unsplash.com/photo-1502673530728-f79b4cab31b1?q=80&w=1200&auto=format&fit=crop',
    ],
    status: 'published',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    title: 'Cozy Studio',
    description: 'Perfect starter studio near downtown',
    price: 550,
    currency: 'USD',
    type: 'apartment',
    bedrooms: 0,
    bathrooms: 1,
    areaSqm: 32,
    location: { city: 'Kigali', region: 'Kigali', country: 'Rwanda' },
    images: [
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop',
    ],
    status: 'published',
    createdAt: new Date().toISOString(),
  },
]

export default function FeaturedProperties({ q = '' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chatOpenFor, setChatOpenFor] = useState(null)
  const location = useLocation()
  const [liveFilter, setLiveFilter] = useState({})

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        setError('')
        setLoading(true)
        const res = await api.getPublishedProperties()
        let list = Array.isArray(res) ? res : []
        // Fallback to demo items in development when API returns nothing
        if (import.meta.env.DEV && list.length === 0) {
          list = DEMO_FEATURED
        }
        if (!ignore) setItems(list)
      } catch (e) {
        if (!ignore) setError(e.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  // Parse filters from URL and live events
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const filters = useMemo(() => {
    const f = {
      q: (q || urlParams.get('q') || '').trim(),
      min: Number(urlParams.get('min') || liveFilter.min || '') || 0,
      max: Number(urlParams.get('max') || liveFilter.max || '') || 0,
      type: (urlParams.get('type') || liveFilter.type || '').trim().toLowerCase(),
      bedrooms: Number(urlParams.get('bedrooms') || liveFilter.bedrooms || '') || 0,
    }
    if (f.min < 0) f.min = 0
    if (f.max < 0) f.max = 0
    return f
  }, [q, urlParams, liveFilter])

  // Listen for live filter events from Hero
  useEffect(() => {
    function onFilter(e){ setLiveFilter(e?.detail || {}) }
    window.addEventListener('home:filter', onFilter)
    return () => window.removeEventListener('home:filter', onFilter)
  }, [])

  // Apply client-side filtering
  const filtered = useMemo(() => {
    const norm = String(filters.q || '').toLowerCase()
    return (items || []).filter((p) => {
      try {
        // text match
        if (norm) {
          const parts = [p.title, p.description, p.type, p.location?.city, p.location?.region, p.location?.country]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          if (!parts.includes(norm)) return false
        }
        // price range
        const price = Number(p.price || 0)
        if (filters.min && price < filters.min) return false
        if (filters.max && price > filters.max) return false
        // type
        if (filters.type && String(p.type || '').toLowerCase() !== filters.type) return false
        // bedrooms minimum
        const beds = Number(p.bedrooms || 0)
        if (filters.bedrooms && beds < filters.bedrooms) return false
        return true
      } catch { return true }
    })
  }, [items, filters])

  return (
    <section style={{ padding: '32px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 16 }}>Featured Properties</h2>
        {error && <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {loading ? (
            <div>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: '#6b7280' }}>No properties yet.</div>
          ) : (
            filtered.map((p) => {
              const imgs = Array.isArray(p.images) ? p.images : []
              const cover = imgs[0]
              return (
                <article key={p.id} style={{ border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                  {cover ? (
                    <img src={toAbsolute(cover)} alt={p.title} onError={(e)=>{ e.currentTarget.src = 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"160\"/><\\/svg>' }} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ background: '#e5e7eb', height: 160 }} />
                  )}
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    <div style={{ color: '#16a34a', fontWeight: 700 }}>{formatPrice(p.price, p.currency)}</div>
                    <div style={{ color: '#6b7280' }}>{formatLocation(p.location)}</div>
                    <div style={{ fontSize: 14, color: '#374151' }}>{formatDesc(p)}</div>
                    {imgs.length > 1 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto' }}>
                        {imgs.slice(1, 6).map((u, i) => (
                          <img key={i} src={toAbsolute(u)} alt="thumb" onError={(e)=>{ e.currentTarget.style.visibility='hidden' }} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems:'center' }}>
                      <Link to={`/properties/${p.id}`} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}>View Details</Link>
                      <button
                        aria-label="Chat with owner"
                        title="Chat with owner"
                        onClick={()=> setChatOpenFor(p)}
                        style={{ width:36, height:36, border:'1px solid #111827', background:'#111827', color:'#fff', borderRadius:8, cursor:'pointer', display:'grid', placeItems:'center' }}
                      >
                        💬
                      </button>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
      {chatOpenFor && (
        <InquiryChatPopup open={!!chatOpenFor} property={chatOpenFor} onClose={()=>setChatOpenFor(null)} />
      )}
    </section>
  )
}

function formatPrice(amount, currency) {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(amount || 0) } catch { return `${amount} ${currency || ''}` }
}
function formatLocation(loc = {}) {
  const parts = [loc.city, loc.region, loc.country].filter(Boolean)
  return parts.join(', ')
}
function formatDesc(p) {
  const pieces = []
  if (p.bedrooms) pieces.push(`${p.bedrooms} bed`)
  if (p.bathrooms) pieces.push(`${p.bathrooms} bath`)
  if (p.areaSqm) pieces.push(`${p.areaSqm} m²`)
  return pieces.join(' · ')
}

function toAbsolute(u) {
  try {

    return new URL(u, window.location.origin).toString()
  } catch {
    return u
  }
}
