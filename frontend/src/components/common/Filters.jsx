import { useMemo, useState } from 'react'

export default function Filters({ initial = {}, onChange }) {
  const [values, setValues] = useState({
    q: initial.q || '',
    city: initial.city || '',
    minPrice: initial.minPrice || '',
    maxPrice: initial.maxPrice || '',
    type: initial.type || '',
    bedrooms: initial.bedrooms || '',
    bathrooms: initial.bathrooms || '',
    saleType: initial.saleType || '', // sale | rent
  })

  const anyActive = useMemo(() => {
    return Object.entries(values).some(([k, v]) => (k !== 'q' ? String(v || '').trim() : ''))
  }, [values])

  function update(k, v) {
    const next = { ...values, [k]: v }
    setValues(next)
    onChange?.(next)
  }

  const inputStyle = { padding: '12px 14px', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, background: '#ffffff', color: '#111827', width: '100%' }
  const wrapStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }
  // Gradient card like the homepage hero (blue -> green)
  const cardStyle = {
    background: 'linear-gradient(90deg, #08a0f7 0%, #1cc5c9 50%, #22c55e 100%)',
    border: '1px solid rgba(2,6,23,0.06)',
    borderRadius: 14,
    padding: 14,
    boxShadow: '0 10px 30px rgba(2,6,23,0.12)'
  }

  return (
    <div style={cardStyle}>
      <div style={wrapStyle}>
        <input style={inputStyle} placeholder="Location (city)" value={values.city} onChange={(e) => update('city', e.target.value)} />
        <input style={inputStyle} placeholder="Min Price" type="number" min="0" value={values.minPrice} onChange={(e) => update('minPrice', e.target.value)} />
        <input style={inputStyle} placeholder="Max Price" type="number" min="0" value={values.maxPrice} onChange={(e) => update('maxPrice', e.target.value)} />
        <select style={{ ...inputStyle, borderColor: values.type ? '#2563eb' : '#e5e7eb' }} value={values.type} onChange={(e) => update('type', e.target.value)}>
          <option value="">Type</option>
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="commercial">Commercial</option>
          <option value="land">Land</option>
        </select>
        <select style={inputStyle} value={values.bedrooms} onChange={(e) => update('bedrooms', e.target.value)}>
          <option value="">Bedrooms</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
        <select style={inputStyle} value={values.bathrooms} onChange={(e) => update('bathrooms', e.target.value)}>
          <option value="">Bathrooms</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
        </select>
        <select style={inputStyle} value={values.saleType} onChange={(e) => update('saleType', e.target.value)}>
          <option value="">Sale / Rent</option>
          <option value="sale">For Sale</option>
          <option value="rent">For Rent</option>
        </select>
      </div>
      {anyActive && (
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => { const blank = { q:'', city:'', minPrice:'', maxPrice:'', type:'', bedrooms:'', bathrooms:'', saleType:'' }; setValues(blank); onChange?.(blank) }}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', background: '#ffffff', color:'#111827', borderRadius: 8, cursor: 'pointer' }}
          >Clear filters</button>
        </div>
      )}
    </div>
  )
}
