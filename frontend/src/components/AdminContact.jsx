import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminContact() {
  const { user } = useAuth()
  const adminEmail = useMemo(() => user?.email || 'admin@example.com', [user])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  function openMailto() {
    const s = encodeURIComponent(subject || '')
    const b = encodeURIComponent(message || '')
    const href = `mailto:${adminEmail}?subject=${s}&body=${b}`
    window.location.href = href
  }

  function copyEmail() {
    try {
      navigator.clipboard.writeText(adminEmail)
      alert('Email copied to clipboard')
    } catch {}
  }

  const disabled = !String(message).trim()

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <div>
        <h3 style={{ margin: 0 }}>Contact Admin</h3>
        <div style={{ color: '#6b7280', fontSize: 13 }}>Send inquiries or reports directly to the admin inbox.</div>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', padding: 16, display: 'grid', gap: 10 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>To</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input value={adminEmail} readOnly style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
            <button onClick={copyEmail} style={{ padding: '8px 10px', border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>Copy</button>
          </div>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Subject</span>
          <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject" style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Message</span>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Write your message..." rows={8} style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, resize: 'vertical' }} />
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button disabled={disabled} onClick={openMailto} style={{ padding: '10px 14px', border: '1px solid #111827', background: '#111827', color: '#fff', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}>Send</button>
        </div>
      </div>
    </section>
  )
}
