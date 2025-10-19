import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function SellerInquiries() {
  const { user } = useAuth()
  const ownerId = user?.id
  const [list, setList] = useState([])
  const [activeId, setActiveId] = useState('')
  const [thread, setThread] = useState({ inquiry: null, messages: [] })
  const [property, setProperty] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    let cancel = false
    async function load() {
      if (!ownerId) return
      try {
        setError('')
        const items = await api.getInquiries(ownerId)
        if (!cancel) setList(items || [])
      } catch (e) { if (!cancel) setError(e.message) }
    }
    load()
    return () => { cancel = true }
  }, [ownerId])

  useEffect(() => {
    let cancel = false
    async function load() {
      if (!activeId) return
      try {
        const data = await api.getInquiry(activeId)
        if (!cancel) {
          setThread({ inquiry: data.inquiry, messages: data.messages })
          // fetch property details for context (title)
          if (data?.inquiry?.propertyId) {
            try {
              const p = await api.getProperty(data.inquiry.propertyId)
              if (!cancel) setProperty(p)
            } catch { /* ignore */ }
          } else {
            setProperty(null)
          }
        }
      } catch (e) { if (!cancel) setError(e.message) }
    }
    load()
    return () => { cancel = true }
  }, [activeId])

  async function sendReply(e){
    e.preventDefault()
    if (!text.trim()) return
    try{
      setLoading(true)
      await api.replyInquiry(activeId, text)
      setText('')
      // reload thread
      const data = await api.getInquiry(activeId)
      setThread({ inquiry: data.inquiry, messages: data.messages })
      // refresh list order
      const items = await api.getInquiries(ownerId)
      setList(items || [])
    }catch(err){ setError(err.message) } finally{ setLoading(false) }
  }

  async function archiveActive(){
    if (!activeId) return
    try{
      setArchiving(true)
      await api.archiveInquiry(activeId)
      // refresh list and clear selection
      const items = await api.getInquiries(ownerId)
      setList(items || [])
      setActiveId('')
      setThread({ inquiry: null, messages: [] })
      setProperty(null)
    }catch(err){ setError(err.message) } finally{ setArchiving(false) }
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
        <div style={{ padding: 10, fontWeight: 700, borderBottom: '1px solid #e5e7eb' }}>Inbox</div>
        <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
          {list.map((it)=> (
            <button key={it._id} onClick={()=>setActiveId(it._id)} style={{ display:'block', width:'100%', textAlign:'left', padding:12, border:'none', background: activeId===it._id?'#f1f5f9':'#fff', borderBottom:'1px solid #e5e7eb', cursor:'pointer' }}>
              <div style={{ fontWeight:600 }}>{it.buyerName} <span style={{ color:'#6b7280', fontWeight:400 }}>({it.buyerEmail})</span></div>
              <div style={{ fontSize:13, color:'#64748b' }}>Property: {it.propertyId}</div>
              <div style={{ fontSize:12, color:'#94a3b8' }}>{new Date(it.lastActivityAt).toLocaleString()}</div>
            </button>
          ))}
          {list.length===0 && <div style={{ padding: 12, color:'#6b7280' }}>No inquiries yet.</div>}
        </div>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Conversation</h3>
        {thread.inquiry && (
          <div style={{ marginBottom: 8, fontSize: 14, color: '#475569' }}>
            <div><strong>From:</strong> {thread.inquiry.buyerName} (<a href={`mailto:${thread.inquiry.buyerEmail}`}>{thread.inquiry.buyerEmail}</a>)</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span><strong>Regarding:</strong> {property?.title || thread.inquiry.propertyId}</span>
              {thread.inquiry?.propertyId && (
                <Link
                  to={`/properties/${thread.inquiry.propertyId}`}
                  state={{ inquiryId: thread.inquiry?._id }}
                  style={{ fontSize:12 }}
                >
                  Open property
                </Link>
              )}
              <button onClick={archiveActive} disabled={archiving} style={{ marginLeft:'auto', padding:'4px 8px', border:'1px solid #e5e7eb', borderRadius:6, background:'#fff', cursor:'pointer' }}>{archiving?'Archiving...':'Archive'}</button>
            </div>
          </div>
        )}
        {error && <div style={{ background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:8, borderRadius:8 }}>{error}</div>}
        <div style={{ maxHeight: '60vh', overflow:'auto', display:'grid', gap:8, paddingRight:8 }}>
          {thread.messages.map((m)=> (
            <div key={m._id} style={{ justifySelf: m.sender==='owner'?'end':'start', background: m.sender==='owner'?'#e0f2fe':'#f1f5f9', padding:'8px 10px', borderRadius:10, maxWidth: '70%' }}>
              <div style={{ fontSize:12, color:'#64748b' }}>{m.sender} • {new Date(m.createdAt).toLocaleString()}</div>
              <div>{m.text}</div>
            </div>
          ))}
          {thread.messages.length===0 && <div style={{ color:'#6b7280' }}>Select an inquiry to view messages.</div>}
        </div>
        <form onSubmit={sendReply} style={{ marginTop: 12, display:'flex', gap:8 }}>
          <input value={text} onChange={e=>setText(e.target.value)} placeholder="Write a reply..." style={{ flex:1, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }} />
          <button disabled={!activeId || loading} className="btn btn-primary" type="submit">{loading?'Sending...':'Send'}</button>
        </form>
      </div>
    </section>
  )
}
