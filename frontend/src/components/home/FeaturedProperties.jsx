import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../../services/api'

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
      '/api/uploads/city-view-apartment-01.jpg',
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

const FEATURED_CACHE_KEY = 'relstate:featured-properties'
const FEATURED_LIMIT = 40

function readCachedFeatured() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(FEATURED_CACHE_KEY) || 'null')
    return Array.isArray(cached) && cached.length ? cached : null
  } catch { return null }
}

function cacheFeatured(items) {
  try { sessionStorage.setItem(FEATURED_CACHE_KEY, JSON.stringify(items)) } catch { /* storage is optional */ }
}

export default function FeaturedProperties({ q = '' }) {
  const [items, setItems] = useState(() => readCachedFeatured() || (import.meta.env.DEV ? DEMO_FEATURED : []))
  const [loading, setLoading] = useState(() => !readCachedFeatured() && !import.meta.env.DEV)
  const [error, setError] = useState('')
  const location = useLocation()
  const [liveFilter, setLiveFilter] = useState({})

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        setError('')
        if (!readCachedFeatured() && !import.meta.env.DEV) setLoading(true)
        const res = await api.getPublishedProperties()
        const published = Array.isArray(res) ? res : []
        const selected = published.filter(property => property.featured)
        let list = (selected.length ? selected : published).slice(0, FEATURED_LIMIT)
        // Fallback to demo items in development when API returns nothing
        if (import.meta.env.DEV && list.length === 0) {
          list = DEMO_FEATURED
        }
        if (!ignore && list.length) {
          setItems(list)
          cacheFeatured(list)
        }
      } catch (e) {
        if (!ignore) {
          // In development, if API fails (e.g., backend not ready/proxy error),
          // fall back to demo featured items and suppress the error banner.
          if (import.meta.env.DEV) {
            setItems(DEMO_FEATURED)
            setError('')
          } else {
            setError(e.message)
          }
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, []) // A cached section is shown immediately while this refresh runs once.

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
        {error && <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>{formatError(error)}</div>}
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
                    <img src={toAbsolute(cover)} alt={p.title} loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ background: '#e5e7eb', height: 160 }} />
                  )}
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    <div style={{ color: '#16a34a', fontWeight: 700 }}>{formatPrice(p.price, p.currency)}</div>
                    <div style={{ color: '#6b7280' }}>{formatLocation(p.location)}</div>
                    <div style={{ fontSize: 14, color: '#374151' }}>{formatDesc(p)}</div>
                    <div style={{ marginTop: 12 }}>
                      <Link to={`/properties/${p.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid #08785f', borderRadius: 7, background: '#08785f', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}><span>View property</span><span aria-hidden="true">→</span></Link>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

function formatPrice(amount, currency) {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(amount || 0) } catch { return `${amount} ${currency || ''}` }
}
function formatError(err) {
  if (!err) return ''
  if (typeof err === 'object') {
    try { return JSON.stringify(err) } catch { return String(err) }
  }
  const s = String(err || '')
  // If server returned an HTML error page, avoid rendering raw HTML in the UI.
  if (s.trim().startsWith('<')) return 'Server error (HTML response). Check API logs.'
  // Truncate very long messages for UI friendliness
  if (s.length > 100) return s.slice(0, 100) + '...'
  return s
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
