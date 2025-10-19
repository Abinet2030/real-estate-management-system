import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api'

export default function Contact() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  async function submit(e) {
    e.preventDefault()
    setSuccess('')
    setError('')
    try {
      setLoading(true)
      await api.createSupportTicket({ name, email, subject, message, userId: user?.id || user?._id })
      setSuccess('Message sent! We will get back to you soon.')
      setSubject('')
      setMessage('')
    } catch (err) {
      setError(err.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ marginBottom: 8 }}>Contact Admin</h1>
      <p style={{ color: '#6b7280', marginTop: 0 }}>Buyers and owners can reach the admin team here.</p>

      {success && <div style={{ background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0', padding:'10px 12px', borderRadius: 8, marginBottom: 12 }}>{success}</div>}
      {error && <div style={{ background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:'10px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}

      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display:'block', fontSize:12, color:'#374151' }}>Your Name *</label>
          <input required value={name} onChange={e=>setName(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius: 8 }} />
        </div>
        <div>
          <label style={{ display:'block', fontSize:12, color:'#374151' }}>Your Email *</label>
          <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius: 8 }} />
        </div>
        <div>
          <label style={{ display:'block', fontSize:12, color:'#374151' }}>Subject</label>
          <input value={subject} onChange={e=>setSubject(e.target.value)} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius: 8 }} />
        </div>
        <div>
          <label style={{ display:'block', fontSize:12, color:'#374151' }}>Message *</label>
          <textarea required value={message} onChange={e=>setMessage(e.target.value)} rows={8} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius: 8, resize:'vertical' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button disabled={loading} type="submit" style={{ padding:'10px 14px', border:'1px solid #111827', background:'#111827', color:'#fff', borderRadius: 8, opacity: loading?0.7:1 }}>{loading?'Sending...':'Send Message'}</button>
        </div>
      </form>
    </main>
  )
}
