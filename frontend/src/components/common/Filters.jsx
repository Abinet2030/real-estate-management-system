import { useMemo, useState } from 'react'

export default function Filters({ initial = {}, onChange }) {
  const [values, setValues] = useState({ q: initial.q || '', city: initial.city || '', minPrice: initial.minPrice || '', maxPrice: initial.maxPrice || '', type: initial.type || '', bedrooms: initial.bedrooms || '', bathrooms: initial.bathrooms || '', saleType: initial.saleType || '' })
  const anyActive = useMemo(() => Object.entries(values).some(([key, value]) => key !== 'q' && String(value || '').trim()), [values])
  const update = (key, value) => { const next = { ...values, [key]: value }; setValues(next); onChange?.(next) }
  const clear = () => { const blank = { q: '', city: '', minPrice: '', maxPrice: '', type: '', bedrooms: '', bathrooms: '', saleType: '' }; setValues(blank); onChange?.(blank) }

  return <div className="property-filters">
    <div className="filter-heading"><span>Refine your search</span><small>Use any combination of filters</small></div>
    <div className="filter-fields">
      <label className="filter-field filter-location"><span>Location</span><input placeholder="City or neighbourhood" value={values.city} onChange={(e) => update('city', e.target.value)} /></label>
      <label className="filter-field"><span>Property type</span><select value={values.type} onChange={(e) => update('type', e.target.value)}><option value="">All types</option><option value="apartment">Apartment</option><option value="house">House</option><option value="commercial">Commercial</option><option value="land">Land</option></select></label>
      <label className="filter-field"><span>Bedrooms</span><select value={values.bedrooms} onChange={(e) => update('bedrooms', e.target.value)}><option value="">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></select></label>
      <label className="filter-field"><span>Bathrooms</span><select value={values.bathrooms} onChange={(e) => update('bathrooms', e.target.value)}><option value="">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option></select></label>
      <label className="filter-field"><span>Listing type</span><select value={values.saleType} onChange={(e) => update('saleType', e.target.value)}><option value="">Buy or rent</option><option value="sale">For sale</option><option value="rent">For rent</option></select></label>
      <label className="filter-field"><span>Minimum price</span><input placeholder="No minimum" type="number" min="0" value={values.minPrice} onChange={(e) => update('minPrice', e.target.value)} /></label>
      <label className="filter-field"><span>Maximum price</span><input placeholder="No maximum" type="number" min="0" value={values.maxPrice} onChange={(e) => update('maxPrice', e.target.value)} /></label>
    </div>
    {anyActive && <div className="filter-actions"><button type="button" onClick={clear}>Clear all filters</button></div>}
  </div>
}
