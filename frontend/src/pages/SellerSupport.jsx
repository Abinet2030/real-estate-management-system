import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api'

export default function SellerSupport() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(true)

  useEffect(() => {
    setName(user?.name || '')
    setEmail(user?.email || '')
  }, [user?.name, user?.email])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoadingTickets(true)
        const all = await api.getSupportTickets()
        const mine = (all || []).filter(t => {
          const byEmail = email && t.email && t.email.toLowerCase() === email.toLowerCase()
          const byUser = user?.id && (t.userId === user.id)
          return byEmail || byUser
        })
        if (!cancelled) setTickets(mine)
      } catch (e) {
        // best-effort; do not block UI
      } finally {
        if (!cancelled) setLoadingTickets(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [email, user?.id])

  async function submit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!name || !email || !message) {
      setError('Please fill name, email and message.')
      return
    }
    try {
      setSubmitting(true)
      await api.createSupportTicket({ name, email, subject, message, userId: user?.id })
      setSuccess('Your message has been sent to the admin. We will get back to you shortly.')
      setSubject(''); setMessage('')
      // refresh tickets
      const all = await api.getSupportTickets()
      const mine = (all || []).filter(t => {
        const byEmail = email && t.email && t.email.toLowerCase() === email.toLowerCase()
        const byUser = user?.id && (t.userId === user.id)
        return byEmail || byUser
      })
      setTickets(mine)
    } catch (e) {
      setError(e.message || 'Failed to send')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section style={{ display:'grid', gap:16 }}>
      <div>
        <h2 style={{ margin: 0 }}>Contact Support</h2>
        <div style={{ color:'#64748b' }}>Report an issue or ask for help. Your message will be sent to the admin.</div>
      </div>

      {error && (
        <div style={{ background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:'10px 12px', borderRadius:8 }}>{error}</div>
      )}
      {success && (
        <div style={{ background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0', padding:'10px 12px', borderRadius:8 }}>{success}</div>
      )}

      <form onSubmit={submit} style={{ display:'grid', gap:12, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
        <div style={row}>
          <div style={field}><label style={label}>Name *</label><input style={input} value={name} onChange={e=>setName(e.target.value)} required /></div>
          <div style={field}><label style={label}>Email *</label><input style={input} type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
        </div>
        <div style={field}><label style={label}>Subject</label><input style={input} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Brief summary" /></div>
        <div style={field}><label style={label}>Message *</label><textarea style={{ ...input, minHeight: 120 }} value={message} onChange={e=>setMessage(e.target.value)} required placeholder="Describe your issue or request..." /></div>
        <div>
          <button disabled={submitting} type="submit" style={{ padding:'10px 14px', borderRadius:8, border:'1px solid #111827', background:'#111827', color:'#fff', cursor:'pointer' }}>
            {submitting ? 'Sending...' : 'Send to Admin'}
          </button>
        </div>
      </form>

      <div style={{ display:'grid', gap:8 }}>
        <h3 style={{ margin: 0 }}>Your Support Tickets</h3>
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
          {loadingTickets ? (
            <div>Loading...</div>
          ) : (tickets || []).length === 0 ? (
            <div style={{ color:'#6b7280' }}>No tickets yet.</div>
          ) : (
            <div style={{ display:'grid', gap:8 }}>
              {tickets.map(t => (
                <article key={t._id} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, padding:12, border:'1px solid #f1f5f9', borderRadius:10 }}>
                  <div>
                    <div style={{ fontWeight:600 }}>{t.subject || 'No subject'}</div>
                    <div style={{ color:'#6b7280', fontSize:14 }}>{t.message}</div>
                    <div style={{ color:'#64748b', fontSize:12, marginTop:4 }}>Status: {t.status || 'open'} • Last activity: {new Date(t.lastActivityAt || t.createdAt).toLocaleString()}</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

const row = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }
const field = { display:'grid', gap:4 }
const label = { fontSize: 13, color:'#374151' }
const input = { padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff' }
