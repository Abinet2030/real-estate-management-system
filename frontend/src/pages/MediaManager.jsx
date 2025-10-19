import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function MediaManager(){
  const { user } = useAuth()
  const ownerId = user?.id
  const [items, setItems] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('modified') // name | size | modified
  const [preview, setPreview] = useState(null) // URL to preview in modal

  async function load(){
    try{
      setError('')
      const list = await api.getMedia(ownerId)
      setItems(Array.isArray(list)? list : [])
    }catch(e){ setError(e.message) }
  }
  useEffect(()=>{ load() }, [ownerId])

  async function onFiles(files){
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    setUploading(true)
    try{
      const res = await fetch('/api/uploads/images', { method:'POST', body: fd })
      if(!res.ok) throw new Error('Upload failed')
      await res.json()
      await load()
    }catch(e){ setError(e.message) } finally{ setUploading(false) }
  }

  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase()
    let list = Array.isArray(items) ? [...items] : []
    if (q) list = list.filter(m => (m.filename||'').toLowerCase().includes(q))
    list.sort((a,b)=>{
      if (sortKey==='name') return (a.filename||'').localeCompare(b.filename||'')
      if (sortKey==='size') return (b.size||0) - (a.size||0)
      // modified (desc)
      return new Date(b.modifiedAt||0) - new Date(a.modifiedAt||0)
    })
    return list
  }, [items, query, sortKey])

  function copy(text){
    try{ navigator.clipboard?.writeText(text) }catch{}
  }

  return (
    <section>
      {/* Header */}
      <div style={{ display:'grid', gap:4 }}>
        <h2 style={{ margin: 0, fontSize: 24 }}>Media Manager</h2>
        <div style={{ color:'#64748b' }}>Upload, organize, and reuse media across your listings.</div>
      </div>
      {/* Helper panel */}
      <div style={{ border:'1px solid #e5e7eb', background:'#f8fafc', padding:14, borderRadius:12, marginTop:12 }}>
        <div style={{ fontWeight:700, marginBottom:6 }}>Tips</div>
        <ul style={{ margin:0, paddingLeft: '18px', color:'#475569', fontSize:13, lineHeight:1.7 }}>
          <li><strong>Upload</strong> via drag & drop or browse from your computer.</li>
          <li><strong>Copy</strong> a direct link, HTML, or Markdown for quick sharing.</li>
          <li><strong>Preview</strong> any image in-app for a closer look.</li>
        </ul>
      </div>
      {error && <div style={{ background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:8, borderRadius:8 }}>{error}</div>}
      {/* Uploader */}
      <div
        onDragOver={(e)=>{e.preventDefault(); e.dataTransfer.dropEffect='copy'}}
        onDrop={(e)=>{ e.preventDefault(); const files = Array.from(e.dataTransfer.files||[]); if(files.length) onFiles(files) }}
        style={{ marginTop: 12, padding: 20, border:'1px dashed #cbd5e1', borderRadius: 12, background:'#f8fafc', display:'grid', placeItems:'center', color:'#475569' }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
          <span role="img" aria-label="upload">📤</span>
          <span>Drag & drop images here, or</span>
          <label style={{ textDecoration:'underline', cursor:'pointer' }}>
            browse<input type="file" multiple accept="image/*" style={{ display:'none' }} onChange={(e)=>{ const files = Array.from(e.target.files||[]); if(files.length) onFiles(files) }}/>
          </label>
          {uploading && <span style={{ marginLeft: 8 }}>Uploading...</span>}
        </div>
      </div>
      {/* Controls */}
      <div style={{ marginTop: 14, display:'flex', gap:10, alignItems:'center' }}>
        <div style={{ position:'relative', flex:1 }}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by filename..." style={{ width:'100%', padding:'10px 12px 10px 34px', border:'1px solid #e5e7eb', borderRadius:10 }} />
          <span style={{ position:'absolute', top:8, left:10, fontSize:18, color:'#94a3b8' }}>🔎</span>
        </div>
        <select value={sortKey} onChange={e=>setSortKey(e.target.value)} style={{ padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:10 }}>
          <option value="modified">Sort: Recent</option>
          <option value="name">Sort: Name</option>
          <option value="size">Sort: Size</option>
        </select>
        <div style={{ color:'#64748b', fontSize:13 }}>{filtered.length} item{filtered.length===1?'':'s'}</div>
      </div>
      {/* Gallery */}
      <div style={{ marginTop: 14, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:14 }}>
        {filtered.map((m)=> (
          <figure key={m.url} style={{ border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', background:'#fff', margin:0, boxShadow:'0 2px 10px rgba(0,0,0,0.03)' }}>
            <button onClick={()=>setPreview(m.url)} title="Preview" style={{ padding:0, border:'none', display:'block', width:'100%', background:'transparent', cursor:'zoom-in' }}>
              <img src={m.url} alt={m.filename} style={{ width:'100%', aspectRatio:'4 / 3', objectFit:'cover', display:'block' }}/>
            </button>
            <figcaption style={{ padding:10, fontSize:12 }}>
              <div title={m.filename} style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight:600 }}>{m.filename}</div>
              <div style={{ color:'#64748b', display:'flex', justifyContent:'space-between', marginTop:4 }}>
                <span>{formatBytes(m.size)}</span>
                <span>{formatDate(m.modifiedAt || m.createdAt)}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                <button onClick={()=>{ copy(location.origin + m.url) }} style={btn}>Copy URL</button>
                <button onClick={()=>{ window.open(m.url, '_blank') }} style={btn}>Open</button>
                <button onClick={()=>{ copy(`<img src=\"${location.origin + m.url}\" alt=\"${(m.filename||'image').replace(/["<>]/g,'')}\" />`) }} style={btnMuted}>Copy HTML</button>
                <button onClick={()=>{ copy(`![${m.filename||'image'}](${location.origin + m.url})`) }} style={btnMuted}>Markdown</button>
              </div>
            </figcaption>
          </figure>
        ))}
        {filtered.length===0 && <div style={{ color:'#6b7280' }}>No media to show.</div>}
      </div>

      {/* Preview modal */}
      {preview && (
        <div onClick={()=>setPreview(null)} style={modalBackdrop}>
          <div onClick={(e)=>e.stopPropagation()} style={modalCard}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight:700 }}>Preview</div>
              <button onClick={()=>setPreview(null)} style={{ border:'none', background:'transparent', fontSize:20, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ padding:12 }}>
              <img src={preview} alt="preview" style={{ maxWidth:'90vw', maxHeight:'70vh', display:'block', borderRadius:10 }} />
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <button style={btn} onClick={()=> copy(location.origin + preview)}>Copy URL</button>
                <button style={btnMuted} onClick={()=> window.open(preview, '_blank')}>Open in new tab</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// UI helpers
function formatBytes(n){
  const bytes = Number(n||0)
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes/1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb/1024
  return `${mb.toFixed(2)} MB`
}
function formatDate(v){
  try { return new Date(v).toLocaleDateString() } catch { return '' }
}

const btn = { padding:'6px 8px', border:'1px solid #111827', background:'#111827', color:'#fff', borderRadius:8, cursor:'pointer', fontSize:12 }
const btnMuted = { padding:'6px 8px', border:'1px solid #e5e7eb', background:'#fff', color:'#111827', borderRadius:8, cursor:'pointer', fontSize:12 }
const modalBackdrop = { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'grid', placeItems:'center', zIndex:1000 }
const modalCard = { width:'min(900px, 96vw)', background:'#fff', borderRadius:12, boxShadow:'0 30px 80px rgba(0,0,0,0.25)' }
