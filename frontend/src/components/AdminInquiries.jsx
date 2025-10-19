import { useEffect, useState } from 'react'
import api from '../services/api'

export default function AdminInquiries() {
  const [loading, setLoading] = useState(false)
  const [inquiries, setInquiries] = useState([])
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState('')
  const [viewer, setViewer] = useState(null) // { id, inquiry, messages }
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  async function loadAll(){
    try{
      setError('')
      setLoading(true)
      const [inq, tks] = await Promise.all([
        api.getAllInquiries().catch(()=>[]),
        api.getSupportTickets().catch(()=>[]),
      ])
      setInquiries(Array.isArray(inq)?inq:[])
      setTickets(Array.isArray(tks)?tks:[])
    }catch(e){ setError(e.message || 'Failed to load') }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ loadAll() }, [])

  async function openInquiry(id){
    try{
      const det = await api.getInquiry(id)
      setViewer({ id, inquiry: det?.inquiry, messages: det?.messages || [] })
      setReply('')
    }catch(e){ alert(e.message) }
  }

  async function send(){
    if (!viewer?.id) return
    if (!reply.trim()) return
    try{
      setSending(true)
      await api.sendInquiryMessage(viewer.id, reply, [], 'admin')
      const det = await api.getInquiry(viewer.id)
      setViewer({ id: viewer.id, inquiry: det?.inquiry, messages: det?.messages || [] })
      setReply('')
    }catch(e){ alert(e.message) }
    finally{ setSending(false) }
  }

  async function resolveTicket(id){
    try{ await api.resolveSupportTicket(id); await loadAll() } catch(e){ alert(e.message) }
  }

  return (
    <div style={{ display:'grid', gap:16 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <h2 style={{ margin:0 }}>Inquiries & Support</h2>
        <button onClick={loadAll} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff' }}>Refresh</button>
      </div>
      {error && <div style={{ background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:10, borderRadius:8 }}>{error}</div>}

      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:12, borderBottom:'1px solid #f3f4f6', fontWeight:600 }}>Property Inquiries</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#fafafa' }}>
                <th style={th}>Buyer</th>
                <th style={th}>Owner</th>
                <th style={th}>Property</th>
                <th style={th}>Unread (owner)</th>
                <th style={th}>Last Activity</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={td}>Loading...</td></tr>
              ) : inquiries.length === 0 ? (
                <tr><td colSpan={6} style={{ ...td, color:'#6b7280' }}>No inquiries</td></tr>
              ) : (
                inquiries.map(it => (
                  <tr key={it._id || it.id}>
                    <td style={td}>{it.buyerName} <div style={{ color:'#6b7280', fontSize:12 }}>{it.buyerEmail}</div></td>
                    <td style={td}>{String(it.ownerId).slice(-6)}</td>
                    <td style={td}>{String(it.propertyId).slice(-6)}</td>
                    <td style={td}>{it.ownerUnreadCount || 0}</td>
                    <td style={td}>{new Date(it.lastActivityAt || it.updatedAt || it.createdAt).toLocaleString()}</td>
                    <td style={td}><button onClick={()=>openInquiry(it._id || it.id)} style={{ padding:'6px 10px', border:'1px solid #111827', background:'#111827', color:'#fff', borderRadius:8 }}>Open Thread</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:12, borderBottom:'1px solid #f3f4f6', fontWeight:600 }}>Support Tickets</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#fafafa' }}>
                <th style={th}>Name</th>
                <th style={th}>Email</th>
                <th style={th}>Subject</th>
                <th style={th}>Status</th>
                <th style={th}>Last Activity</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={td}>Loading...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={6} style={{ ...td, color:'#6b7280' }}>No tickets</td></tr>
              ) : (
                tickets.map(t => (
                  <tr key={t._id || t.id}>
                    <td style={td}>{t.name}</td>
                    <td style={td}>{t.email}</td>
                    <td style={td}>{t.subject || '-'}</td>
                    <td style={td}>{t.status}</td>
                    <td style={td}>{new Date(t.lastActivityAt || t.updatedAt || t.createdAt).toLocaleString()}</td>
                    <td style={td}>
                      {t.status !== 'resolved' && (
                        <button onClick={()=>resolveTicket(t._id || t.id)} style={{ padding:'6px 10px', border:'1px solid #10b981', background:'#10b981', color:'#fff', borderRadius:8 }}>Mark Resolved</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {viewer && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'grid', placeItems:'center', zIndex:1000 }}>
          <div style={{ width:520, background:'#fff', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:12, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>Inquiry Thread</div>
              <button onClick={()=>setViewer(null)} style={{ border:'none', background:'transparent', fontSize:18, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ padding:12, display:'grid', gap:8 }}>
              <div style={{ maxHeight:240, overflow:'auto', border:'1px solid #eef2f7', borderRadius:8, padding:8, background:'#fafafa' }}>
                {(viewer.messages||[]).map(m => {
                  const mine = m.sender !== 'buyer'
                  return (
                    <div key={m._id} style={{ display:'flex', justifyContent: mine?'flex-end':'flex-start', marginBottom:8 }}>
                      <div style={{ maxWidth:'85%', background: mine?'#111827':'#f3f4f6', color: mine?'#fff':'#111827', padding:'8px 10px', borderRadius:12 }}>
                        {m.text && <div style={{ fontSize:14 }}>{m.text}</div>}
                        <div style={{ fontSize:11, opacity:0.7, marginTop:4, textAlign: mine?'right':'left' }}>{new Date(m.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type a reply..." style={{ flex:1, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }} />
                <button disabled={sending || !reply.trim()} onClick={send} style={{ padding:'8px 12px', border:'1px solid #111827', background:'#111827', color:'#fff', borderRadius:8 }}>{sending?'Sending...':'Send'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const th = { textAlign:'left', padding:'10px 12px', borderBottom:'1px solid #f3f4f6', fontWeight:600 }
const td = { padding:'10px 12px', borderBottom:'1px solid #f3f4f6', verticalAlign:'top' }
