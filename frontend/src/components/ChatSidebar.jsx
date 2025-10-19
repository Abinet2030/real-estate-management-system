import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api'
import { formatUserCode } from '../utils/ids.js'

export default function ChatSidebar({ open, onClose }) {
  const { user } = useAuth()
  const buyerEmail = user?.email || ''
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [active, setActive] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)
  const [thread, setThread] = useState(null)
  const [attaching, setAttaching] = useState(false)
  const [attachments, setAttachments] = useState([]) // array of uploaded URLs
  const fileRef = useRef(null)

  const canOpen = useMemo(()=>Boolean(buyerEmail), [buyerEmail])

  useEffect(()=>{
    if (!open) return
    if (!canOpen) { setError('Login to use chat.'); return }
    let ignore = false
    async function load(){
      try {
        setLoading(true); setError('')
        const items = await api.getBuyerInquiries(buyerEmail)
        if (!ignore) setList(items || [])
        if (!ignore && items?.length && !active) setActive(items[0])
      } catch (e) { if (!ignore) setError(e.message) } finally { if (!ignore) setLoading(false) }
    }
    load()
    return ()=>{ ignore = true }
  }, [open, buyerEmail])

  useEffect(()=>{
    if (!open || !active) return
    let ignore = false
    async function loadThread(){
      try {
        const id = active._id || active.id
        const res = await api.getInquiry(id)
        if (!ignore) {
          setThread(res?.inquiry || null)
          setMsgs(res?.messages || [])
        }
        // mark as read for buyer when opening
        await api.markInquiryRead(id, 'buyer')
        // zero unread locally
        setList(prev => (prev||[]).map(it => it._id===active._id ? { ...it, buyerUnreadCount: 0 } : it))
      } catch (e) {}
    }
    loadThread()
  }, [open, active])

  // auto scroll to bottom on messages change
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs])

  async function send(){
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

  if (!open) return null

  return (
    <aside style={{ position:'fixed', top:12, right:12, height:'calc(100vh - 24px)', width: 420, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, boxShadow:'0 20px 50px rgba(0,0,0,0.12)', zIndex: 1100, display:'grid', gridTemplateRows:'auto 1fr auto', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>
        <div>
          <div style={{ fontWeight:800 }}>Messages</div>
          {active && (
            <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
              <span style={{ fontWeight:700, color:'#111827' }}>Owner</span>
              {` • ${formatUserCode('owner', active.ownerId || 'owner')}`}
            </div>
          )}
        </div>
        <button onClick={onClose} style={{ border:'none', background:'transparent', fontSize:18, cursor:'pointer' }}>×</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr', minHeight:0 }}>
        <div style={{ display:'grid', gridTemplateRows:'1fr auto', minHeight:0 }}>
          <div ref={scrollRef} style={{ overflow:'auto', padding:16, background:'#fff' }}>
            {(msgs||[]).map((m)=>{
              const mine = (m.sender === 'buyer')
              return (
                <div key={m._id} style={{ display:'flex', justifyContent: mine?'flex-end':'flex-start', marginBottom:10 }}>
                  <div style={{ maxWidth:'78%', background: mine?'#111827':'#f3f4f6', color: mine?'#fff':'#111827', padding:'10px 12px', borderRadius:14, borderTopRightRadius: mine?4:14, borderTopLeftRadius: mine?14:4, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize:14, lineHeight:1.4 }}>{m.text}</div>
                    {Array.isArray(m.attachments) && m.attachments.length>0 && (
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                        {m.attachments.map((u,i)=> (
                          <img key={i} src={u} alt="attachment" style={{ width:120, height:120, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff' }} />
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize:11, opacity:0.6, marginTop:6, textAlign: mine?'right':'left' }}>{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              )
            })}
            {(() => {
              if (!msgs?.length) return null
              const lastMine = [...msgs].reverse().find(x => x.sender === 'buyer')
              if (!lastMine) return null
              const seen = thread?.ownerLastReadAt && new Date(thread.ownerLastReadAt) >= new Date(lastMine.createdAt)
              if (!seen) return null
              return (
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
                  <span style={{ fontSize:11, color:'#64748b' }}>Seen</span>
                </div>
              )
            })()}
          </div>
          <div style={{ display:'grid', gap:8, padding:12, borderTop:'1px solid #e5e7eb', background:'#f8fafc' }}>
            {attachments.length>0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {attachments.map((u,i)=> (
                  <div key={i} style={{ position:'relative' }}>
                    <img src={u} alt="preview" style={{ width:72, height:72, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb' }} />
                  </div>
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
              <button onClick={send} disabled={sending} style={{ padding:'10px 14px', border:'1px solid #111827', background:'#111827', color:'#fff', borderRadius:10 }}>{sending?'Sending...':'Send'}</button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
