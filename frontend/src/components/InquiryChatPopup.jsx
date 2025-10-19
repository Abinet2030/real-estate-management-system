import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api'

export default function InquiryChatPopup({ open, property, onClose }){
  const { user } = useAuth()
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const firstInputRef = useRef(null)
  const [existingInquiryId, setExistingInquiryId] = useState('')
  const [historyMsgs, setHistoryMsgs] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(()=>{
    if (user){
      setBuyerName(user.name || '')
      setBuyerEmail(user.email || '')
    }
  }, [user])

  useEffect(()=>{
    if (open) {
      setSuccess('')
      setMessage('')
      setFiles([])
      setTimeout(()=>{ firstInputRef.current?.focus() }, 50)
    }
  }, [open])

  // Load prior conversation for this property/owner when popup opens
  useEffect(() => {
    let ignore = false
    async function loadHistory(){
      if (!open) return
      if (!property?.id || !property?.ownerId) return
      if (!buyerEmail) return
      try {
        setLoadingHistory(true)
        const threads = await api.getBuyerInquiries(buyerEmail)
        const found = (threads||[]).find(t => String(t.propertyId)===String(property.id) && String(t.ownerId)===String(property.ownerId))
        if (!ignore && found) {
          setExistingInquiryId(found._id || found.id)
          const det = await api.getInquiry(found._id || found.id)
          if (!ignore) setHistoryMsgs(det?.messages || [])
        } else if (!ignore) {
          setExistingInquiryId('')
          setHistoryMsgs([])
        }
      } catch {
        if (!ignore) { setExistingInquiryId(''); setHistoryMsgs([]) }
      } finally { if (!ignore) setLoadingHistory(false) }
    }
    loadHistory()
    return () => { ignore = true }
  }, [open, property?.id, property?.ownerId, buyerEmail])

  if (!open) return null

  async function send(e){
    e.preventDefault()
    if (!property?.id || !property?.ownerId) {
      alert('Owner not available for this listing. Please open a different property or contact support.')
      return
    }
    try{
      setLoading(true)
      // If user attached files, upload first to get URLs
      let attachments = []
      if (files.length > 0) {
        try {
          setUploading(true)
          const { urls } = await api.uploadImages(files)
          attachments = Array.isArray(urls) ? urls : []
        } finally {
          setUploading(false)
        }
      }
      if (existingInquiryId) {
        // append to existing thread
        await api.sendInquiryMessage(existingInquiryId, message, attachments)
        const det = await api.getInquiry(existingInquiryId)
        setHistoryMsgs(det?.messages || [])
      } else {
        // create new inquiry thread
        const res = await api.createInquiry({
          propertyId: property.id,
          ownerId: property.ownerId,
          buyerId: user?.id || user?._id,
          buyerName,
          buyerEmail,
          message,
          attachments,
        })
        const newId = res?.inquiryId
        if (newId) {
          setExistingInquiryId(newId)
          const det = await api.getInquiry(newId)
          setHistoryMsgs(det?.messages || [])
        }
      }
      setSuccess('Message sent! The owner will reply soon.')
      setMessage('')
      setFiles([])
    }catch(err){
      alert(err.message)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'grid', placeItems:'center', zIndex:1000 }}>
      <div style={{ width: 420, background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 10px 28px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:700 }}>Contact Owner</div>
          <button onClick={onClose} style={{ border:'none', background:'transparent', fontSize:18, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding: 12, display:'grid', gap:8 }}>
          <div style={{ fontSize:14, color:'#475569' }}>
            <div style={{ fontWeight:600 }}>{property?.title || 'Property'}</div>
            <div style={{ color:'#6b7280' }}>{property?.location?.city ? `${property.location.city}${property.location.region? ', '+property.location.region:''}` : ''}</div>
          </div>
          {!property?.ownerId && (
            <div style={{ background:'#fff7ed', color:'#9a3412', border:'1px solid #fed7aa', padding:'8px 10px', borderRadius:8 }}>
              This listing has no owner assigned, so messaging is disabled.
            </div>
          )}
          <div style={{ maxHeight: 220, overflow:'auto', border:'1px solid #eef2f7', borderRadius:8, padding:8, background:'#fafafa' }}>
            {loadingHistory ? (
              <div style={{ color:'#6b7280' }}>Loading conversation...</div>
            ) : historyMsgs.length === 0 ? (
              <div style={{ color:'#9ca3af' }}>No previous messages.</div>
            ) : (
              historyMsgs.map((m)=>{
                const mine = m.sender === 'buyer'
                return (
                  <div key={m._id} style={{ display:'flex', justifyContent: mine?'flex-end':'flex-start', marginBottom:8 }}>
                    <div style={{ maxWidth:'85%', background: mine?'#111827':'#f3f4f6', color: mine?'#fff':'#111827', padding:'8px 10px', borderRadius:12 }}>
                      {m.text && <div style={{ fontSize:14 }}>{m.text}</div>}
                      {Array.isArray(m.attachments) && m.attachments.length>0 && (
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
                          {m.attachments.map((u,i)=> (
                            <img key={i} src={u} alt="attachment" style={{ width:84, height:84, objectFit:'cover', borderRadius:6, border:'1px solid #e5e7eb', background:'#fff' }} />
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize:11, opacity:0.7, marginTop:4, textAlign: mine?'right':'left' }}>{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {success && <div style={{ background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0', padding:'8px 10px', borderRadius:8 }}>{success}</div>}
          <form onSubmit={send} style={{ display:'grid', gap:8 }}>
            <div>
              <label style={{ display:'block', fontSize:12, color:'#374151' }}>Your Name *</label>
              <input ref={firstInputRef} required value={buyerName} onChange={e=>setBuyerName(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, color:'#374151' }}>Your Email *</label>
              <input required type="email" value={buyerEmail} onChange={e=>setBuyerEmail(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, color:'#374151' }}>Message</label>
              <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="I'm interested in this property..." style={{ width:'100%', minHeight:90, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, color:'#374151' }}>Attachments (images)</label>
              <input type="file" accept="image/*" multiple onChange={(e)=>setFiles(Array.from(e.target.files||[]))} />
              {files.length > 0 && (
                <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                  {files.slice(0,6).map((f, i)=> (
                    <div key={i} style={{ width:48, height:48, border:'1px solid #eee', borderRadius:6, overflow:'hidden', display:'grid', placeItems:'center', background:'#f9fafb' }}>
                      <img src={URL.createObjectURL(f)} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    </div>
                  ))}
                </div>
              )}
              {uploading && <div style={{ color:'#6b7280', fontSize:12, marginTop:4 }}>Uploading...</div>}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button type="button" onClick={onClose} style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff' }}>Close</button>
              <button disabled={loading || uploading || !property?.ownerId} type="submit" style={{ padding:'8px 12px', border:'1px solid #111827', background:'#111827', color:'#fff', borderRadius:8, opacity: (!property?.ownerId?0.6:1) }}>{(loading||uploading)?'Sending...':'Send'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
