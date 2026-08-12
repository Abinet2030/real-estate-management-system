import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPageCopy } from '../../services/siteContent'
import './Hero.css'

export default function Hero() {
  const [loc, setLoc] = useState('')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [type, setType] = useState('')
  const [beds, setBeds] = useState('')
  const navigate = useNavigate()
  const copy = getPageCopy('home')

  function doSearch() {
    const params = new URLSearchParams()
    if (loc.trim()) params.set('q', loc.trim())
    if (min) params.set('min', String(min))
    if (max) params.set('max', String(max))
    if (type) params.set('type', type)
    if (beds) params.set('bedrooms', String(beds))
    navigate(params.toString() ? `/?${params}` : '/')
    window.dispatchEvent(new CustomEvent('home:filter', { detail: Object.fromEntries(params.entries()) }))
  }

  return <section className="home-hero"><div className="hero-backdrop" style={{ '--hero-image': `url("${copy.heroImage}")` }} /><div className="hero-content">
    <div className="hero-copy"><p className="hero-kicker">{copy.kicker}</p><h1>{copy.title}</h1><p>{copy.description}</p><div className="hero-proof"><span><b>500+</b> listings</span><span><b>50+</b> verified agents</span><span><b>4.9/5</b> client rating</span></div></div>
    <div className="hero-search"><div className="search-heading"><span>Find a property</span><small>Search listings that fit your life</small></div><div className="search-fields">
      <label className="field field-location"><span>Location</span><input placeholder="City, neighbourhood, or area" value={loc} onChange={e => setLoc(e.target.value)} /></label>
      <label className="field"><span>Minimum price</span><input placeholder="Any minimum" value={min} onChange={e => setMin(e.target.value)} inputMode="numeric" /></label>
      <label className="field"><span>Maximum price</span><input placeholder="Any maximum" value={max} onChange={e => setMax(e.target.value)} inputMode="numeric" /></label>
      <label className="field"><span>Property type</span><select value={type} onChange={e => setType(e.target.value)}><option value="">Type</option><option value="apartment">Apartment</option><option value="house">House</option><option value="commercial">Commercial</option><option value="land">Land / Plots</option></select></label>
      <label className="field"><span>Bedrooms</span><select value={beds} onChange={e => setBeds(e.target.value)}><option value="">Bedrooms</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></select></label>
      <button className="search-submit" onClick={doSearch}>Search properties <span>→</span></button></div>
      <button className="hero-list-link" onClick={() => navigate('/dashboard/seller')}>Are you listing a property? <b>List it with Relstate →</b></button>
    </div>
  </div></section>
}
