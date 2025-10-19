import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api'

export default function BuyerMessages() {
  const { user } = useAuth()
  const buyerEmail = user?.email || ''
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [active, setActive] = useState(null)
  const [thread, setThread] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [attaching, setAttaching] = useState(false)
  const [attachments, setAttachments] = useState([]) // uploaded URLs
  const fileRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        if (!buyerEmail) return
        setLoading(true); setError('')
        const items = await api.getBuyerInquiries(buyerEmail)
        if (!ignore) {
          setList(items || [])
          if (!active && items?.length) setActive(items[0])
        }
      } catch (e) { if (!ignore) setError(e.message) } finally { if (!ignore) setLoading(false) }
    }
    load()
  }, [buyerEmail])

  useEffect(() => {
    let ignore = false
    async function loadThread() {
      if (!active) return
      try {
        const id = active._id || active.id
        const res = await api.getInquiry(id)
        if (!ignore) {
          setThread(res?.inquiry || null)
          setMsgs(res?.messages || [])
        }
        await api.markInquiryRead(id, 'buyer')
        setList(prev => (prev||[]).map(it => (it._id===active._id ? { ...it, buyerUnreadCount: 0 } : it)))
      } catch (e) {}
    }
    loadThread()
    return () => { ignore = true }
  }, [active])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs])

  async function send() {
    if ((!input.trim() && attachments.length===0) || !active) return
    try {
      setSending(true)
      const id = active._id || active.id
      await api.sendInquiryMessage(id, input.trim(), attachments)
      setInput('')
      setAttachments([])
      const res = await api.getInquiry(id)
      setThread(res?.inquiry || null)
      setMsgs(res?.messages || [])
    } finally { setSending(false) }
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16, minHeight:'calc(100vh - 120px)' }}>
      <aside style={{ border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:12, borderBottom:'1px solid #e5e7eb', fontWeight:800 }}>Your Conversations</div>
        <div style={{ maxHeight:'calc(100vh - 220px)', overflow:'auto' }}>
          {loading ? (
            <div style={{ padding:12, color:'#6b7280' }}>Loading...</div>
          ) : error ? (
            <div style={{ padding:12, color:'#b91c1c' }}>{error}</div>
          ) : (list||[]).length === 0 ? (
            <div style={{ padding:12, color:'#6b7280' }}>No conversations yet.</div>
          ) : (
            (list||[]).map(it => {
              const activeId = active?._id || active?.id
              const id = it._id || it.id
              const unread = Number(it.buyerUnreadCount || 0)
              return (
                <button key={id} onClick={()=>setActive(it)} style={{ display:'block', width:'100%', textAlign:'left', padding:12, border:'none', background: String(activeId)===String(id) ? '#f3f4f6' : '#fff', borderBottom:'1px solid #f3f4f6', cursor:'pointer' }}>
                  <div style={{ fontWeight:700, display:'flex', justifyContent:'space-between' }}>
                    <span>Owner #{(it.ownerId||'').toString().slice(-4)}</span>
                    {unread>0 && <span style={{ background:'#ef4444', color:'#fff', borderRadius:999, padding:'2px 6px', fontSize:11 }}>{unread}</span>}
                  </div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{new Date(it.lastActivityAt || it.createdAt).toLocaleString()}</div>
                </button>
              )
            })
          )}
        </div>
      </aside>
      <section style={{ border:'1px solid #e5e7eb', borderRadius:10, display:'grid', gridTemplateRows:'auto 1fr auto', overflow:'hidden' }}>
        <div style={{ padding:12, borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ fontWeight:800 }}>Chat</div>
          {thread && <div style={{ fontSize:12, color:'#64748b' }}>Property #{String(thread.propertyId).slice(-6)} · Owner #{String(thread.ownerId).slice(-4)}</div>}
        </div>
        <div ref={scrollRef} style={{ padding:16, overflow:'auto', background:'#fff' }}>
          {(msgs||[]).map(m => {
            const mine = (m.sender === 'buyer')
            return (
              <div key={m._id} style={{ display:'flex', justifyContent: mine?'flex-end':'flex-start', marginBottom:10 }}>
                <div style={{ maxWidth:'78%', background: mine?'#111827':'#f3f4f6', color: mine?'#fff':'#111827', padding:'10px 12px', borderRadius:14, borderTopRightRadius: mine?4:14, borderTopLeftRadius: mine?14:4 }}>
                  {m.text && <div style={{ fontSize:14, lineHeight:1.4 }}>{m.text}</div>}
                  {Array.isArray(m.attachments) && m.attachments.length>0 && (
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                      {m.attachments.map((u,i)=> (
                        <img key={i} src={u} alt="attachment" style={{ width:120, height:120, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb' }} />
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize:11, opacity:0.6, marginTop:6, textAlign: mine?'right':'left' }}>{new Date(m.createdAt).toLocaleString()}</div>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ padding:12, borderTop:'1px solid #e5e7eb', background:'#f8fafc', display:'grid', gap:8 }}>
          {attachments.length>0 && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {attachments.map((u,i)=> (
                <img key={i} src={u} alt="preview" style={{ width:72, height:72, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb' }} />
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Type a message..." style={{ flex:1, padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:10 }} />
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={async (e)=>{
              const files = Array.from(e.target.files||[])
              if (!files.length) return
              try {
                setAttaching(true)
                const res = await api.uploadImages(files)
                const urls = res?.urls || []
                setAttachments(prev => [...prev, ...urls])
              } finally { setAttaching(false); e.target.value = '' }
            }} />
            <button title={attaching? 'Uploading...' : 'Attach images'} onClick={()=>fileRef.current?.click()} disabled={attaching} style={{ padding:'10px', border:'1px solid #e5e7eb', background:'#fff', borderRadius:10, cursor:'pointer' }}>📎</button>
            <button onClick={send} disabled={sending || !active} style={{ padding:'10px 14px', border:'1px solid #111827', background:'#111827', color:'#fff', borderRadius:10 }}>{sending?'Sending...':'Send'}</button>
          </div>
        </div>
      </section>
    </div>
  )
}
