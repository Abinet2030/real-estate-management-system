import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Hero() {
  const [loc, setLoc] = useState('')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [type, setType] = useState('')
  const [beds, setBeds] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  function doSearch() {
    const params = new URLSearchParams()
    if (loc.trim()) params.set('q', loc.trim())
    if (min) params.set('min', String(min))
    if (max) params.set('max', String(max))
    if (type) params.set('type', type)
    if (beds) params.set('bedrooms', String(beds))
    const qs = params.toString()
    navigate(qs ? `/?${qs}` : '/')

    window.dispatchEvent(new CustomEvent('home:filter', { detail: Object.fromEntries(params.entries()) }))
  }

  return (
    <section style={{
      background: 'linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)',
      color: '#fff',
      padding: '56px 16px'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 16 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>Find Your Dream Home</h1>
        <p style={{ fontSize: 18, opacity: 0.95 }}>Buy, Sell or Rent properties easily.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Location" value={loc} onChange={e=>setLoc(e.target.value)} style={inputStyle} />
          <input placeholder="Min Price" value={min} onChange={e=>setMin(e.target.value)} inputMode="numeric" style={inputStyle} />
          <input placeholder="Max Price" value={max} onChange={e=>setMax(e.target.value)} inputMode="numeric" style={inputStyle} />
          <select style={inputStyle} value={type} onChange={e=>setType(e.target.value)}>
            <option value="">Type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land / Plots</option>
          </select>
          <select style={inputStyle} value={beds} onChange={e=>setBeds(e.target.value)}>
            <option value="">Bedrooms</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
          <button onClick={doSearch} style={{ padding: '10px 16px', background: '#111827', color: '#fff', borderRadius: 6, border: 'none' }}>
            Search Now
          </button>
          <button onClick={()=> navigate((user?.role||'').toLowerCase()==='agent' ? '/dashboard/agent' : '/dashboard/seller')} style={{ padding: '10px 16px', background: '#fff', color: '#111827', borderRadius: 6, border: '1px solid #e5e7eb' }}>
            List Your Property
          </button>
        </div>
      </div>
    </section>
  )
}

const inputStyle = { padding: '10px 12px', minWidth: 140, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }
