import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api'
import './contact.css'

export default function Contact() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [senderAddress, setSenderAddress] = useState('')
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

  async function submit(event) {
    event.preventDefault()
    setSuccess('')
    setError('')
    try {
      setLoading(true)
      await api.createSupportTicket({ name, email, senderAddress, subject, message, userId: user?.id || user?._id })
      setSuccess('Your inquiry has been sent to the administrator. We will get back to you shortly.')
      setSenderAddress('')
      setSubject('')
      setMessage('')
    } catch (err) {
      setError(err.message || 'Failed to send inquiry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <div>
          <p>Relstate support</p>
          <h1>We’re here to make your next move easier.</h1>
          <span>Questions about a listing, your account, or using the platform? Send us a note and we’ll point you in the right direction.</span>
        </div>
      </section>
      <section className="contact-shell">
        <aside className="contact-aside">
          <p className="contact-kicker">Get in touch</p>
          <h2>Helpful answers start with a conversation.</h2>
          <p>Our team supports buyers, owners, and anyone exploring the Relstate marketplace.</p>
          <div className="contact-options">
            <article><b>✉</b><div><strong>Email support</strong><span>hello@relstate.example</span></div></article>
            <article><b>◷</b><div><strong>Typical response time</strong><span>Within one business day</span></div></article>
            <article><b>⌂</b><div><strong>Need listing help?</strong><span>Include the property title or link.</span></div></article>
          </div>
          <div className="contact-note">For a specific property, you can also use the inquiry form directly on its details page.</div>
        </aside>
        <section className="contact-form-card">
          <div className="form-heading"><p>Send an inquiry to admin</p><h2>How can we help?</h2><span>Fields marked with * are required.</span></div>
          {success && <div className="form-message success">✓ {success}</div>}
          {error && <div className="form-message error">{error}</div>}
          <form onSubmit={submit}>
            <div className="form-grid">
              <label>Sender name *<input required value={name} onChange={event => setName(event.target.value)} placeholder="Your full name" /></label>
              <label>Sender email address *<input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
            </div>
            <label>Sender address <em>(optional)</em><input value={senderAddress} onChange={event => setSenderAddress(event.target.value)} placeholder="Your address" maxLength={500} /></label>
            <label>What can we help with?<input value={subject} onChange={event => setSubject(event.target.value)} placeholder="For example, a question about a property" /></label>
            <label>Your message *<textarea required value={message} onChange={event => setMessage(event.target.value)} rows={7} placeholder="Tell us a little more so we can help quickly." /></label>
            <button className="contact-submit" disabled={loading} type="submit">{loading ? 'Sending inquiry…' : 'Send inquiry to admin'} <span>→</span></button>
          </form>
        </section>
      </section>
    </main>
  )
}
