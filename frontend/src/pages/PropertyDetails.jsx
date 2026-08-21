import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'
import './property-details.css'
import './property-image-remove.css'

export default function PropertyDetails() {
  const { id } = useParams()
  const normalizedId = String(id || '').replace(/^:/, '')
  const { user } = useAuth()
  const location = useLocation()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [senderAddress, setSenderAddress] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState('')

  const loadProperty = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.getProperty(normalizedId)
      const property = Array.isArray(response) ? response[0] : (response?.data ?? response?.property ?? response)
      if (!property) throw new Error('Property not found')
      setItem(property)
      setActiveImage(0)
    } catch (err) {
      setError(err.message || 'Failed to load property')
    } finally {
      setLoading(false)
    }
  }, [normalizedId])

  useEffect(() => { loadProperty() }, [loadProperty])
  useEffect(() => {
    if (user?.name) setBuyerName(user.name)
    if (user?.email) setBuyerEmail(user.email)
  }, [user])
  useEffect(() => {
    if (!loading && location.hash === '#contact') document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }, [loading, location.hash])

  if (loading) return <div className="property-loading">Loading property…</div>
  if (error) return <div className="property-error"><h2>Unable to open this property</h2><p>{error}</p><button onClick={loadProperty}>Try again</button><Link to="/properties">Back to properties</Link></div>
  if (!item) return null

  const images = imageCandidates(item)
  const current = Math.min(activeImage, Math.max(images.length - 1, 0))
  const canModify = !!(user && String(user.role || '').toLowerCase() === 'admin')
  const amenities = Array.isArray(item.features) ? item.features : (Array.isArray(item.amenities) ? item.amenities : [])
  const contactTitle = 'Send inquiry to admin'

  async function removeImage(imageUrl) {
    if (!canModify) return window.alert('You are not authorized to remove images from this property.')
    if (!window.confirm('Remove this image from the property?')) return
    try {
      const remaining = images.filter(u => toAbsolute(u) !== toAbsolute(imageUrl))
      const propertyId = item.id || item._id || normalizedId
      await api.updateProperty(propertyId, { images: remaining })

      try {
        const key = 'relstate:property-overrides:v1'
        const raw = localStorage.getItem(key) || '{}'
        const overrides = JSON.parse(raw)
        overrides[propertyId] = { ...(overrides[propertyId] || {}), images: remaining }
        localStorage.setItem(key, JSON.stringify(overrides))
      } catch {
        // ignore localStorage issues; the UI state change below still removes the image
      }

      setItem(prev => ({ ...prev, images: remaining }))
      setActiveImage(0)
    } catch (err) {
      window.alert(err.message || 'Unable to remove image')
    }
  }

  async function sendInquiry(event) {
    event.preventDefault()
    setSent('')
    try {
      setSending(true)
      await api.createSupportTicket({
        name: buyerName,
        email: buyerEmail,
        senderAddress,
        subject: `Property inquiry: ${item.title || 'Property'}`,
        message: `Property: ${item.title || normalizedId}\nProperty ID: ${item.id || item._id || normalizedId}\n\n${message || 'No message provided.'}`,
        userId: user?.id || user?._id,
      })
      setSent('Your inquiry has been sent to the administrator. We will get back to you shortly.')
      setSenderAddress('')
      setMessage('')
    } catch (err) { window.alert(err.message || 'Unable to send inquiry') } finally { setSending(false) }
  }

  return (
    <main className="property-page">
      <div className="property-shell">
        <Link className="back-link" to="/properties">← Browse all properties</Link>
        <div className="property-heading">
          <div><p className="property-status">{statusLabel(item.status)}</p><h1>{item.title || 'Property'}</h1><p className="property-location">⌖ {formatLocation(item.location)}</p></div>
          <div className="property-price">{formatCurrency(item.price, item.currency)}</div>
        </div>

        <section className="property-hero-grid">
          <ImmersiveGallery
            images={images}
            title={item.title}
            index={current}
            onChange={setActiveImage}
            onOpen={() => setViewerOpen(true)}
            canModify={canModify}
            onRemoveImage={removeImage}
          />
          {Array.isArray(item.videos) && item.videos.length > 0 && (
            <aside className="property-videos">
              <h3>Virtual tour</h3>
              <VideoGallery videos={item.videos} title={item.title} />
            </aside>
          )}
          <aside className="property-summary">
            <p className="eyebrow">{String(item.type || 'Property').toUpperCase()} · {statusLabel(item.status)}</p>
            <h2>{formatCurrency(item.price, item.currency)}</h2>
            <div className="property-specs">
              <Fact icon="▣" label="Bedrooms" value={item.bedrooms ?? '—'} />
              <Fact icon="◫" label="Bathrooms" value={item.bathrooms ?? '—'} />
              <Fact icon="⌑" label="Area" value={item.areaSqm ? `${item.areaSqm} m²` : '—'} />
              <Fact icon="⌂" label="Type" value={capitalize(item.type) || '—'} />
            </div>
            <button className="primary-action" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Inquire about this property</button>
            <p className="summary-note">Available for inquiries · Photos shown in original aspect ratio</p>
          </aside>
        </section>

        <section className="detail-layout">
          <div className="detail-content">
            <article className="detail-card"><h2>About this property</h2><p>{item.description || 'No description has been provided for this property.'}</p></article>
            <article className="detail-card"><h2>Property details</h2><div className="detail-facts"><Detail label="Property type" value={capitalize(item.type)} /><Detail label="Availability" value={statusLabel(item.status)} /><Detail label="Location" value={formatLocation(item.location)} /><Detail label="Address" value={item.location?.address || '—'} /><Detail label="Bedrooms" value={item.bedrooms ?? '—'} /><Detail label="Bathrooms" value={item.bathrooms ?? '—'} /><Detail label="Area / size" value={item.areaSqm ? `${item.areaSqm} m²` : '—'} /></div></article>
            <article className="detail-card"><h2>Amenities</h2>{amenities.length ? <div className="amenity-list">{amenities.map((amenity, index) => <span key={`${amenity}-${index}`}>✓ {amenity}</span>)}</div> : <p className="muted">Amenities have not been listed yet.</p>}</article>
          </div>
          <aside className="contact-card" id="contact"><p className="eyebrow">Interested in this property?</p><h2>{contactTitle}</h2><ContactPerson agent={item.agent} owner={item.owner} fallbackId={item.agentId || item.ownerId} /><form onSubmit={sendInquiry}><label>Your name<input required value={buyerName} onChange={e => setBuyerName(e.target.value)} /></label><label>Email address<input required type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} /></label><label>Message<textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={`I'm interested in ${item.title}.`} /></label>{sent && <p className="inquiry-success">{sent}</p>}<button className="primary-action" disabled={sending}>{sending ? 'Sending…' : 'Send inquiry'}</button></form></aside>
        </section>
      </div>
      <ImageViewer open={viewerOpen} images={images} index={current} title={item.title} onChange={setActiveImage} onClose={() => setViewerOpen(false)} />
    </main>
  )
}

function ImmersiveGallery({ images, title, index, onChange, onOpen, canModify, onRemoveImage }) {
  if (!images.length) return <div className="gallery-empty">No property photos available</div>
  const select = next => onChange((next + images.length) % images.length)
  return (
    <div className="immersive-gallery">
      <div style={{ position: 'relative' }}>
        <button className="gallery-main" onClick={onOpen} aria-label="Open full-screen photo viewer">
          <img src={toAbsolute(images[index])} alt={title || 'Property'} />
          <span className="gallery-overlay"><b>Immersive photo tour</b><small>Open image viewer</small></span>
        </button>
        {canModify && (
          <button className="image-remove-button" onClick={(e) => { e.stopPropagation(); onRemoveImage(images[index]) }} aria-label="Remove image">×</button>
        )}
      </div>
      {images.length > 1 && <>
        <button className="gallery-arrow previous" onClick={() => select(index - 1)} aria-label="Previous photo">‹</button>
        <button className="gallery-arrow next" onClick={() => select(index + 1)} aria-label="Next photo">›</button>
      </>}
      <button className="gallery-expand" onClick={onOpen}>⛶ <span>View photos</span> {images.length > 1 && `(${index + 1}/${images.length})`}</button>
      <div className="gallery-thumbnails">
        {images.map((image, imageIndex) => (
          <div key={image} style={{ position: 'relative' }}>
            <button onClick={() => onChange(imageIndex)} className={imageIndex === index ? 'active' : ''} aria-label={`Show photo ${imageIndex + 1}`}>
              <img src={toAbsolute(image)} alt="" />
            </button>
            {canModify && (
              <button className="image-remove-thumb" onClick={(e) => { e.stopPropagation(); onRemoveImage(image) }} aria-label={`Remove photo ${imageIndex + 1}`}>×</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ImageViewer({ open, images, index, title, onChange, onClose }) {
  const stageRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [closing, setClosing] = useState(false)
  const drag = useRef(null)
  const touch = useRef(null)
  useEffect(() => { setScale(1); setPosition({ x: 0, y: 0 }); setClosing(false) }, [index, open])
  const closeWithAnimation = useCallback(() => { if (closing) return; setClosing(true); window.setTimeout(onClose, 170) }, [closing, onClose])
  useEffect(() => { if (!open) return; const key = event => { if (event.key === 'Escape') closeWithAnimation(); if (event.key === 'ArrowRight') onChange((index + 1) % images.length); if (event.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length) }; window.addEventListener('keydown', key); document.body.style.overflow = 'hidden'; return () => { window.removeEventListener('keydown', key); document.body.style.overflow = '' } }, [open, index, images.length, onChange, closeWithAnimation])
  if (!open || !images.length) return null
  const updateScale = value => { const next = Math.min(5, Math.max(1, value)); setScale(next); if (next === 1) setPosition({ x: 0, y: 0 }) }
  const navigate = direction => onChange((index + direction + images.length) % images.length)
  function onWheel(event) { event.preventDefault(); updateScale(scale + (event.deltaY < 0 ? .25 : -.25)) }
  function pointerDown(event) { if (scale <= 1) return; event.currentTarget.setPointerCapture?.(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, start: position } }
  function pointerMove(event) { if (!drag.current) return; setPosition({ x: drag.current.start.x + event.clientX - drag.current.x, y: drag.current.start.y + event.clientY - drag.current.y }) }
  function pointerUp() { drag.current = null }
  function touchStart(event) { const points = event.touches; if (points.length === 2) { const dx = points[0].clientX - points[1].clientX; const dy = points[0].clientY - points[1].clientY; touch.current = { distance: Math.hypot(dx, dy), scale, x: 0 } } else if (points.length === 1) touch.current = { x: points[0].clientX, scale } }
  function touchMove(event) { if (!touch.current) return; const points = event.touches; if (points.length === 2) { event.preventDefault(); const dx = points[0].clientX - points[1].clientX; const dy = points[0].clientY - points[1].clientY; updateScale(touch.current.scale * (Math.hypot(dx, dy) / touch.current.distance)) } }
  function touchEnd(event) { if (touch.current && event.changedTouches.length === 1 && scale === 1) { const distance = event.changedTouches[0].clientX - touch.current.x; if (Math.abs(distance) > 55) navigate(distance < 0 ? 1 : -1) } touch.current = null }
  async function requestFullScreen() { try { await stageRef.current?.requestFullscreen?.() } catch { /* browser can deny fullscreen; modal remains full viewport */ } }
  return <div className={`image-viewer${closing ? ' viewer-closing' : ''}`} role="dialog" aria-modal="true" aria-label="Property photo viewer"><div className="viewer-toolbar"><span>{title} · {index + 1} / {images.length}</span><div><button onClick={() => updateScale(scale - .25)} aria-label="Zoom out">−</button><span className="zoom-value">{Math.round(scale * 100)}%</span><button onClick={() => updateScale(scale + .25)} aria-label="Zoom in">+</button><button onClick={requestFullScreen} aria-label="Browser fullscreen">⛶</button><button onClick={closeWithAnimation} aria-label="Close viewer">×</button></div></div><div ref={stageRef} className="viewer-stage" onWheel={onWheel} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onTouchStart={touchStart} onTouchMove={touchMove} onTouchEnd={touchEnd}><img draggable="false" src={toAbsolute(images[index])} alt={title || 'Property'} style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})` }} />{images.length > 1 && <><button className="viewer-nav left" onClick={() => navigate(-1)}>‹</button><button className="viewer-nav right" onClick={() => navigate(1)}>›</button></>}</div><div className="viewer-thumbnails">{images.map((image, imageIndex) => <button className={imageIndex === index ? 'active' : ''} key={image} onClick={() => onChange(imageIndex)}><img src={toAbsolute(image)} alt={`Photo ${imageIndex + 1}`} /></button>)}</div></div>
}

function VideoGallery({ videos = [], title = '' }) {
  const [index, setIndex] = useState(0)
  if (!Array.isArray(videos) || !videos.length) return null
  const src = videos[index]
  const getYouTubeId = (u) => {
    if (!u) return null
    try {
      const url = new URL(u, window.location.origin)
      if (url.hostname.includes('youtu.be')) return url.pathname.replace(/^\//, '')
      if (url.hostname.includes('youtube.com')) return url.searchParams.get('v')
    } catch { return null }
    return null
  }
  const ytId = getYouTubeId(src)
  return (
    <div className="video-gallery">
      <div className="video-stage">
        {ytId ? (
          <div style={{ position: 'relative', paddingTop: '56.25%' }}>
            <iframe title={`Virtual tour for ${title}`} src={`https://www.youtube.com/embed/${ytId}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        ) : (
          <video controls style={{ width: '100%', maxHeight: '360px' }} src={toAbsolute(src)} aria-label={`Virtual tour for ${title}`}>
            Sorry, your browser doesn't support embedded videos.
          </video>
        )}
      </div>
      {videos.length > 1 && <div className="video-thumbs">{videos.map((v, i) => <button key={v} onClick={() => setIndex(i)} className={i === index ? 'active' : ''} aria-label={`Play video ${i + 1}`}><span>▶</span><small>{`Video ${i + 1}`}</small></button>)}</div>}
    </div>
  )
}

function Fact({ icon, label, value }) { return <div><b>{icon} {value}</b><span>{label}</span></div> }
function Detail({ label, value }) { return <div><span>{label}</span><strong>{value || '—'}</strong></div> }
function ContactPerson({ agent, owner, fallbackId }) { const contact = agent || owner; if (!contact) return <p className="muted">Listing contact available on inquiry{fallbackId ? '' : ' once this property is assigned'}.</p>; return <div className="contact-person"><div>{(contact.name || 'C')[0].toUpperCase()}</div><p><strong>{contact.name || 'Listing contact'}</strong><span>{contact.email || contact.phone || 'Property representative'}</span></p></div> }
function formatCurrency(value, currency) { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(Number(value || 0)) } catch { return `${value || '—'} ${currency || ''}` } }
function formatLocation(location = {}) { return [location.address, location.city, location.region, location.country].filter(Boolean).join(', ') || 'Location available on request' }
function capitalize(value) { return value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : '' }
function statusLabel(status) { return capitalize(status || 'Available') }
function toAbsolute(url) { try { return new URL(url, window.location.origin).toString() } catch { return url } }
function imageCandidates(property) { const images = []; const add = value => { const url = typeof value === 'string' ? value : value?.url || value?.src; if (url?.trim() && !images.includes(url.trim())) images.push(url.trim()) }; (property?.images || []).forEach(add); (property?.allImages || []).forEach(add); (property?.imageUrls || []).forEach(add); (property?.photos || []).forEach(add); (property?.media || []).forEach(add); Object.values(property?.galleries || {}).forEach(group => Array.isArray(group) && group.forEach(add)); [property?.coverImage, property?.coverUrl, property?.image, property?.imageUrl].forEach(add); return images }
