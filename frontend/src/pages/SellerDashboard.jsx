import SellerTopBar from '../components/SellerTopBar.jsx'
import SellerSidebar from '../components/SellerSidebar.jsx'
import SellerInquiries from './SellerInquiries.jsx'
import MediaManager from './MediaManager.jsx'
import Home from './Home.jsx'
import SellerSupport from './SellerSupport.jsx'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function SellerDashboard() {
  const [active, setActive] = useState('dashboard') // 'dashboard' | 'add' | ...
  const [success, setSuccess] = useState('')
  const { user } = useAuth()
  const [overviewQuery, setOverviewQuery] = useState('')
  const previewRef = useRef(null)
  const [searchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Listen to cross-component navigation/search events from SellerTopBar
  useEffect(() => {
    function onNavigate(e){
      const key = e?.detail?.key
      if (typeof key === 'string') setActive(key)
    }
    function onSearch(e){
      const q = e?.detail?.q || ''
      setOverviewQuery(q)
      try { previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {}
    }
    function onMenu(){ setSidebarOpen(true) }
    window.addEventListener('seller:navigate', onNavigate)
    window.addEventListener('seller:search', onSearch)
    window.addEventListener('seller:menu', onMenu)
    return () => {
      window.removeEventListener('seller:navigate', onNavigate)
      window.removeEventListener('seller:search', onSearch)
      window.removeEventListener('seller:menu', onMenu)
    }
  }, [])

  // Initialize from URL query: /dashboard/... ?tab=add|listings|inquiries|media|support|dashboard
  useEffect(() => {
    const t = (searchParams.get('tab') || '').toLowerCase()
    const allowed = new Set(['dashboard','add','listings','inquiries','media','support'])
    if (allowed.has(t)) setActive(t)
  }, [searchParams])

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <SellerSidebar activeKey={active} onSelect={(k) => { setActive(k); setSuccess('') }} isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)} />
      <div className="content-with-sidebar" style={{ display: 'grid', gridTemplateRows: 'auto 1fr' }}>
        {/* Floating dashboard icon for mobile to open sidebar */}
        <button
          className="fab-menu only-mobile"
          onClick={()=>setSidebarOpen(true)}
          aria-label="Open sidebar"
          title="Open menu"
          style={{ position:'fixed', left:12, top:72, zIndex:70, padding:10, border:'1px solid #e5e7eb', borderRadius:999, background:'#111827', color:'#fff', boxShadow:'0 8px 20px rgba(0,0,0,0.15)' }}
        >📊</button>
        <SellerTopBar />
        <main style={{ padding: '24px 16px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 16 }}>
            {active === 'add' ? (
              <AddListingForm ownerId={user?.id} agentId={user?.id} onCreated={() => { setSuccess('Listing submitted. It may require admin review before publishing.'); setActive('listings') }} />
            ) : active === 'listings' ? (
              <MyListings ownerId={user?.id} />
            ) : active === 'inquiries' ? (
              <SellerInquiries />
            ) : active === 'media' ? (
              <MediaManager />
            ) : active === 'support' ? (
              <SellerSupport />
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
                  <h2 style={{ margin: 0 }}>{(user?.role||'owner').toString().toLowerCase()==='agent' ? 'Agent Dashboard' : 'Owner Dashboard'}</h2>
                </div>
                {success && (
                  <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '10px 12px', borderRadius: 8 }}>
                    {success}
                  </div>
                )}
                {/* Embedded public homepage instead of cards */}
                <section style={{ marginTop: 8 }} ref={previewRef}>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    <Home q={overviewQuery} />
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function Card({ title, desc, onOpen }) {
  return (
    <article style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={{ color: '#6b7280' }}>{desc}</div>
      <button onClick={onOpen} style={{ marginTop: 12, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Open</button>
    </article>
  )
}

export function AddListingForm({ ownerId, agentId, onCreated }) {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [type, setType] = useState('house')
  const [bedrooms, setBedrooms] = useState(0)
  const [bathrooms, setBathrooms] = useState(0)
  const [areaSqm, setAreaSqm] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [country, setCountry] = useState('')
  const [publish, setPublish] = useState(true)
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [images, setImages] = useState([])
  // New categorized galleries
  const [livingImages, setLivingImages] = useState([])
  const [kitchenImages, setKitchenImages] = useState([])
  const [bedroomImages, setBedroomImages] = useState([])
  const [bathroomImages, setBathroomImages] = useState([])
  const [exteriorImages, setExteriorImages] = useState([])
  const [floorplanImages, setFloorplanImages] = useState([])
  // Features (buyer-facing highlights)
  const [features, setFeatures] = useState(['Parking', 'Balcony', 'Secure Area'])
  const [featureInput, setFeatureInput] = useState('')
  // Preview modal for all photos
  const [showPhotos, setShowPhotos] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  async function uploadFiles(files) {
    const fd = new FormData()
    files.forEach((f) => fd.append('files', f))
    setUploading(true)
    try {
      const res = await fetch('/api/uploads/images', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      return Array.isArray(data.urls) ? data.urls : []
    } finally {
      setUploading(false)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const allImages = [
        ...images,
        ...livingImages,
        ...kitchenImages,
        ...bedroomImages,
        ...bathroomImages,
        ...exteriorImages,
        ...floorplanImages,
      ].filter(Boolean)
      const body = {
        title,
        price: Number(price),
        currency,
        type,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        areaSqm: Number(areaSqm || 0),
        location: { address, city, region, country },
        description,
        images: allImages,
        // New structured galleries for richer buyer detail
        galleries: {
          living: livingImages,
          kitchen: kitchenImages,
          bedrooms: bedroomImages,
          bathrooms: bathroomImages,
          exterior: exteriorImages,
          floorplan: floorplanImages,
        },
        // Compatibility fields some backends expect
        allImages,
        imageUrls: allImages,
        photos: allImages,
        features,
        ownerId,
        agentId,
        publish,
      }
      const res = await api.createProperty(body)
      if (res?.property) {
        onCreated?.()
        // Reset minimal fields
        setTitle(''); setPrice(''); setDescription(''); setImages([]); setImageUrl('')
        setLivingImages([]); setKitchenImages([]); setBedroomImages([]); setBathroomImages([]); setExteriorImages([]); setFloorplanImages([])
        setFeatures(['Parking', 'Balcony', 'Secure Area']); setFeatureInput('')
        setShowPhotos(false)
      }
    } catch (e2) {
      setError(e2.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
      <h2 style={{ marginTop: 0, textAlign: 'center' }}>Add Listing</h2>
      {error && <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <div style={row}><div style={field}><label style={label}>Title *</label><input style={input} value={title} onChange={e=>setTitle(e.target.value)} required /></div></div>
        <div style={row}>
          <div style={field}><label style={label}>Price *</label><input style={input} type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} required /></div>
          <div style={field}><label style={label}>Currency</label>
            <select style={input} value={currency} onChange={e=>setCurrency(e.target.value)}>
              <option value="USD">USD</option>
              <option value="ETB">ETB</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div style={field}><label style={label}>Type</label>
            <select style={input} value={type} onChange={e=>setType(e.target.value)}>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="land">Land</option>
              <option value="office">Office</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div style={row}>
          <div style={field}><label style={label}>Bedrooms</label><input style={input} type="number" min="0" value={bedrooms} onChange={e=>setBedrooms(e.target.value)} /></div>
          <div style={field}><label style={label}>Bathrooms</label><input style={input} type="number" min="0" value={bathrooms} onChange={e=>setBathrooms(e.target.value)} /></div>
          <div style={field}><label style={label}>Area (m²)</label><input style={input} type="number" min="0" value={areaSqm} onChange={e=>setAreaSqm(e.target.value)} /></div>
        </div>
        <div style={row}>
          <div style={field}><label style={label}>Address</label><input style={input} value={address} onChange={e=>setAddress(e.target.value)} /></div>
          <div style={field}><label style={label}>City</label><input style={input} value={city} onChange={e=>setCity(e.target.value)} /></div>
          <div style={field}><label style={label}>Region/State</label><input style={input} value={region} onChange={e=>setRegion(e.target.value)} /></div>
          <div style={field}><label style={label}>Country</label><input style={input} value={country} onChange={e=>setCountry(e.target.value)} /></div>
        </div>
        <div style={row}><div style={field}><label style={label}>Description</label><textarea style={{ ...input, minHeight: 80 }} value={description} onChange={e=>setDescription(e.target.value)} /></div></div>
        <div style={row}>
          <div style={field}>
            <label style={label}>Add cover image URL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...input, flex: 1 }} placeholder="https://..." value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
              <button type="button" onClick={() => { if (imageUrl) { setImages(prev => [...prev, imageUrl]); setImageUrl('') } }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Add</button>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
              onDrop={async (e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
                if (files.length === 0) return
                const urls = await uploadFiles(files)
                if (urls?.length) setImages(prev => [...prev, ...urls])
              }}
              style={{ marginTop: 8, padding: 12, border: '1px dashed #cbd5e1', borderRadius: 8, background: '#f8fafc', color: '#475569' }}
            >
              Drag & drop images here, or <label style={{ textDecoration: 'underline', cursor: 'pointer' }}>
                browse<input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={async (e) => { const files = Array.from(e.target.files || []); if (files.length) { const urls = await uploadFiles(files); if (urls?.length) setImages(prev => [...prev, ...urls]) } }} />
              </label>
              {uploading && <span style={{ marginLeft: 8 }}>Uploading...</span>}
            </div>
            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginTop: 8 }}>
                {images.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <img src={url} alt="preview" style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                    <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 4, right: 4, background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
            {/* Preview all photos button */}
            {(()=>{ const all = [
              ...images,
              ...livingImages,
              ...kitchenImages,
              ...bedroomImages,
              ...bathroomImages,
              ...exteriorImages,
              ...floorplanImages,
            ].filter(Boolean); return all.length>0 ? (
              <div style={{ marginTop:8 }}>
                <button type="button" onClick={()=> setShowPhotos(true)} style={{ padding:'8px 10px', border:'1px solid #111827', background:'#111827', color:'#fff', borderRadius:6, cursor:'pointer' }}>
                  Preview all photos ({all.length})
                </button>
              </div>
            ) : null })()}
            {/* Categorized galleries for richer buyer detail */}
            <div style={{ display:'grid', gap:12, marginTop:12 }}>
              <PhotoSection title="Living Room" list={livingImages} setList={setLivingImages} uploadFiles={uploadFiles} />
              <PhotoSection title="Kitchen" list={kitchenImages} setList={setKitchenImages} uploadFiles={uploadFiles} />
              <PhotoSection title="Bedrooms" list={bedroomImages} setList={setBedroomImages} uploadFiles={uploadFiles} />
              <PhotoSection title="Bathrooms" list={bathroomImages} setList={setBathroomImages} uploadFiles={uploadFiles} />
              <PhotoSection title="Exterior" list={exteriorImages} setList={setExteriorImages} uploadFiles={uploadFiles} />
              <PhotoSection title="Floor Plan" list={floorplanImages} setList={setFloorplanImages} uploadFiles={uploadFiles} />
            </div>
            {/* Features */}
            <div style={{ marginTop:12, border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
              <div style={{ fontWeight:700, marginBottom:8 }}>Features</div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={featureInput} onChange={e=>setFeatureInput(e.target.value)} placeholder="Add a feature (e.g., Garden)" style={{ ...input, flex:1 }} />
                <button type="button" onClick={()=>{ const v=(featureInput||'').trim(); if(v && !features.includes(v)){ setFeatures([...features, v]); setFeatureInput('') } }} style={{ padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, background:'#fff', cursor:'pointer' }}>Add</button>
              </div>
              {/* Quick-add */}
              <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                {['Parking','Balcony','Secure Area','Garden','Furnished','Newly Built'].map((q)=> (
                  <button key={q} type="button" onClick={()=>{ if(!features.includes(q)) setFeatures([...features, q]) }} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:999, background:'#fff', cursor:'pointer', fontSize:12 }}>{q}</button>
                ))}
              </div>
              {/* Chips */}
              <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
                {features.map((f, i)=> (
                  <span key={`${f}-${i}`} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 10px', border:'1px solid #cbd5e1', background:'#f8fafc', borderRadius:999, fontSize:12 }}>
                    {f}
                    <button type="button" onClick={()=> setFeatures(features.filter((_, idx)=> idx!==i))} title="Remove" style={{ border:'none', background:'transparent', cursor:'pointer' }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input id="publish" type="checkbox" checked={publish} onChange={e=>setPublish(e.target.checked)} />
          <label htmlFor="publish">Publish immediately</label>
        </div>
        <div>
          <button disabled={loading} type="submit" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Save Listing'}
          </button>
        </div>
      </form>
      {/* Modal: preview all photos before saving */}
      {(()=>{
        const all = [
          ...images,
          ...livingImages,
          ...kitchenImages,
          ...bedroomImages,
          ...bathroomImages,
          ...exteriorImages,
          ...floorplanImages,
        ].filter(Boolean)
        return (
          <PreviewPhotosModal open={showPhotos} onClose={()=> setShowPhotos(false)} images={all} />
        )
      })()}
    </section>
  )
}

const row = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }
const field = { display: 'grid', gap: 4 }
const label = { fontSize: 13, color: '#374151' }
const input = { padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }

// Small reusable section for categorized photos
function PhotoSection({ title, list, setList, uploadFiles }){
  const [url, setUrl] = useState('')
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ display:'flex', gap:8 }}>
        <input placeholder="https://..." value={url} onChange={e=>setUrl(e.target.value)} style={{ ...input, flex:1 }} />
        <button type="button" onClick={()=>{ if(url){ setList(prev=>[...prev, url]); setUrl('') } }} style={{ padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, background:'#fff', cursor:'pointer' }}>Add</button>
      </div>
      <div
        onDragOver={(e)=>{ e.preventDefault(); e.dataTransfer.dropEffect='copy' }}
        onDrop={async (e)=>{ e.preventDefault(); const files = Array.from(e.dataTransfer.files||[]).filter(f=>f.type.startsWith('image/')); if(!files.length) return; const urls = await uploadFiles(files); if(urls?.length) setList(prev=>[...prev, ...urls]) }}
        style={{ marginTop: 8, padding: 12, border: '1px dashed #cbd5e1', borderRadius: 8, background: '#f8fafc', color: '#475569' }}
      >
        Drag & drop images here, or <label style={{ textDecoration:'underline', cursor:'pointer' }}>
          browse<input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={async (e)=>{ const files = Array.from(e.target.files||[]); if(files.length){ const urls = await uploadFiles(files); if(urls?.length) setList(prev=>[...prev, ...urls]) } }} />
        </label>
      </div>
      {list?.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:8, marginTop:8 }}>
          {list.map((u, i)=> (
            <div key={i} style={{ position:'relative', border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden' }}>
              <img src={u} alt={title} style={{ width:'100%', height:80, objectFit:'cover' }} />
              <button type="button" onClick={()=> setList(list.filter((_, idx)=> idx!==i))} style={{ position:'absolute', top:4, right:4, background:'#fff', border:'1px solid #ddd', borderRadius:6, padding:'2px 6px', cursor:'pointer' }}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PreviewPhotosModal({ open, onClose, images }){
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'grid', placeItems:'center', padding:16 }}>
      <div onClick={(e)=> e.stopPropagation()} style={{ width:'min(1100px, 96vw)', maxHeight:'90vh', overflow:'auto', background:'#fff', borderRadius:12, padding:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontWeight:800 }}>All Photos ({images.length})</div>
          <button onClick={onClose} style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:6, padding:'6px 10px', cursor:'pointer' }}>Close</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:10 }}>
          {images.map((u, i)=> (
            <img key={i} src={u} alt={`photo-${i}`} style={{ width:'100%', height:160, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ----- MyListings and helpers -----
export function MyListings({ ownerId, agentId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setError('')
        setLoading(true)
        if (!ownerId && !agentId) { setItems([]); return }
        let res = []
        if (ownerId) {
          res = await api.getPropertiesByOwner(ownerId)
        } else if (agentId) {
          res = await api.getProperties({ agentId })
        }
        if (!cancelled) setItems(Array.isArray(res) ? res : [])
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [ownerId, agentId])

  return (
    <section>
      <h2 style={{ margin: 0 }}>My Listings</h2>
      {error && <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: 8, marginTop: 12 }}>{error}</div>}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No listings yet.</div>
        ) : (
          items.map((p) => (
            <article key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff', display:'grid' }}>
              <ImageCover property={p} alt={p.title} />
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 600 }}>{p.title}</div>
                <div style={{ color: '#16a34a', fontWeight: 700 }}>{priceToText(p.price, p.currency)}</div>
                <div style={{ color: '#6b7280' }}>{locToText(p.location)}</div>
                <div style={{ fontSize: 14, color: '#374151' }}>{descText(p)}</div>
                <div style={{ marginTop:8, display:'flex', gap:8 }}>
                  <button type="button" onClick={()=> setSelected(p)} style={{ padding:'6px 10px', border:'1px solid #111827', background:'#111827', color:'#fff', borderRadius:6, cursor:'pointer', fontSize:12 }}>View details</button>
                  <a href={`/properties/${p.id}`} target="_blank" rel="noreferrer" style={{ padding:'6px 10px', border:'1px solid #e5e7eb', background:'#fff', borderRadius:6, fontSize:12, textDecoration:'none', color:'#111827' }}>Open public page</a>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
      <OwnerDetailsModal item={selected} onClose={()=> setSelected(null)} />
    </section>
  )
}

function ImageCover({ property, alt }) {
  const [idx, setIdx] = useState(0)
  const candidates = imageCandidates(property)
  const url = candidates[idx]
  if (!url) return <div style={{ background: '#e5e7eb', height: 160 }} />
  const src = toAbsolute(url)
  return <img src={src} alt={alt} onError={()=>{ if (idx < candidates.length - 1) setIdx(idx + 1) }} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
}

function toAbsolute(u){ try { return new URL(u, window.location.origin).toString() } catch { return u } }
function imageCandidates(p){
  const out = []
  try{
    const push = (u)=>{ if(!u) return; if(typeof u==='string'){ const s=u.trim(); if(s && !out.includes(s)) out.push(s) } else if (u.url||u.src){ const s=(u.url||u.src).trim(); if(s && !out.includes(s)) out.push(s) } }
    // images array
    if (Array.isArray(p?.images)) p.images.forEach(push)
    if (Array.isArray(p?.allImages)) p.allImages.forEach(push)
    // galleries
    const g = p?.galleries || {}
    ;['living','kitchen','bedrooms','bathrooms','exterior','floorplan'].forEach(k=>{
      const list = Array.isArray(g[k]) ? g[k] : []
      list.forEach(push)
    })
    // common fallbacks
    ;[p?.coverImage, p?.coverUrl, p?.image, p?.imageUrl, p?.imageURL].forEach(push)
    if (Array.isArray(p?.imageUrls)) p.imageUrls.forEach(push)
    if (Array.isArray(p?.photos)) p.photos.forEach(push)
    if (Array.isArray(p?.media)) p.media.forEach(push)
  }catch{}
  return out
}
function priceToText(amount, currency){ try{ return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(amount || 0) } catch{ return `${amount} ${currency||''}` } }
function locToText(loc = {}) { const parts = [loc.city, loc.region, loc.country].filter(Boolean); return parts.join(', ') }
function descText(p){ const pieces=[]; if(p.bedrooms) pieces.push(`${p.bedrooms} bed`); if(p.bathrooms) pieces.push(`${p.bathrooms} bath`); if(p.areaSqm) pieces.push(`${p.areaSqm} m²`); return pieces.join(' · ') }

function OwnerDetailsModal({ item, onClose }){
  if (!item) return null
  const [data, setData] = useState(item)
  useEffect(() => {
    let cancelled = false
    async function load(){
      try{
        if (!item?.id) { setData(item); return }
        const res = await api.getProperty(item.id)
        const full = Array.isArray(res) ? res[0] : (res.data ?? res)
        if (!cancelled) setData(full || item)
      }catch{
        if (!cancelled) setData(item)
      }
    }
    load()
    return () => { cancelled = true }
  }, [item])
  const imgs = imageCandidates(data)
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'grid', placeItems:'center', padding:16 }}>
      <div onClick={(e)=> e.stopPropagation()} style={{ width:'min(1100px, 96vw)', maxHeight:'92vh', overflow:'auto', background:'#fff', borderRadius:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ fontWeight:800 }}>{data.title || 'Listing details'}</div>
          <button onClick={onClose} style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:6, padding:'6px 10px', cursor:'pointer' }}>Close</button>
        </div>
        <div style={{ padding:16, display:'grid', gap:12 }}>
          {/* Gallery */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden' }}>
            {imgs.length ? (
              <img src={toAbsolute(imgs[0])} alt={data.title} style={{ width:'100%', height:300, objectFit:'cover', display:'block' }} />
            ) : (
              <div style={{ height:300, background:'#e5e7eb' }} />
            )}
            {imgs.length > 1 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:8, padding:8 }}>
                {imgs.map((u, i)=> (
                  <img key={i} src={toAbsolute(u)} alt={`thumb-${i}`} style={{ width:'100%', height:80, objectFit:'cover', borderRadius:6, border:'1px solid #e5e7eb' }} />
                ))}
              </div>
            )}
          </div>
          {/* Info */}
          <div style={{ display:'grid', gap:8 }}>
            <div style={{ color:'#16a34a', fontWeight:800 }}>{priceToText(data.price, data.currency)}</div>
            <div style={{ color:'#6b7280' }}>{[data?.location?.address, data?.location?.city, data?.location?.region, data?.location?.country].filter(Boolean).join(', ')}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:8 }}>
              <OwnerSpec label="Bedrooms" value={data.bedrooms} />
              <OwnerSpec label="Bathrooms" value={data.bathrooms} />
              <OwnerSpec label="Area" value={data.areaSqm ? `${data.areaSqm} m²` : '—'} />
              <OwnerSpec label="Type" value={String(data.type||'—').toUpperCase()} />
            </div>
            {data.description && <div style={{ whiteSpace:'pre-wrap' }}>{data.description}</div>}
          </div>
          {/* Features */}
          {(Array.isArray(data.features) && data.features.length>0) && (
            <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:12, background:'#fff' }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>Features</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {data.features.map((f,i)=> (<span key={`${f}-${i}`} style={{ padding:'6px 10px', border:'1px solid #cbd5e1', background:'#f8fafc', borderRadius:999, fontSize:12 }}>{f}</span>))}
              </div>
            </div>
          )}
          {/* All photos grid */}
          {imgs.length>0 && (
            <div>
              <div style={{ fontWeight:700, marginBottom:6 }}>All Photos ({imgs.length})</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:8 }}>
                {imgs.map((u,i)=> (<img key={i} src={toAbsolute(u)} alt={`img-${i}`} style={{ width:'100%', height:120, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb' }} />))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OwnerSpec({ label, value }){
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px', background:'#fff' }}>
      <div style={{ fontSize:12, color:'#6b7280' }}>{label}</div>
      <div style={{ fontWeight:700 }}>{value ?? '—'}</div>
    </div>
  )
}
