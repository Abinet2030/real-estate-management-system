import { useState } from 'react'

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

  function update(k, v) {
    const next = { ...values, [k]: v }
    setValues(next)
    onChange?.(next)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
      <input placeholder="Location (city)" value={values.city} onChange={(e) => update('city', e.target.value)} />
      <input placeholder="Min Price" value={values.minPrice} onChange={(e) => update('minPrice', e.target.value)} />
      <input placeholder="Max Price" value={values.maxPrice} onChange={(e) => update('maxPrice', e.target.value)} />
      <select value={values.type} onChange={(e) => update('type', e.target.value)}>
        <option value="">Type</option>
        <option value="apartment">Apartment</option>
        <option value="villa">Villa</option>
        <option value="commercial">Commercial</option>
        <option value="land">Land</option>
      </select>
      <select value={values.bedrooms} onChange={(e) => update('bedrooms', e.target.value)}>
        <option value="">Bedrooms</option>
        <option value="1">1+</option>
        <option value="2">2+</option>
        <option value="3">3+</option>
        <option value="4">4+</option>
      </select>
      <select value={values.bathrooms} onChange={(e) => update('bathrooms', e.target.value)}>
        <option value="">Bathrooms</option>
        <option value="1">1+</option>
        <option value="2">2+</option>
        <option value="3">3+</option>
      </select>
      <select value={values.saleType} onChange={(e) => update('saleType', e.target.value)}>
        <option value="">Sale / Rent</option>
        <option value="sale">For Sale</option>
        <option value="rent">For Rent</option>
      </select>
    </div>
  )
}
