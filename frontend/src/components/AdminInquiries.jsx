import { useEffect, useState } from 'react'
import api from '../services/api'

export default function AdminInquiries() {
  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState('')

  async function loadAll() {
    try {
      setError('')
      setLoading(true)
      const results = await api.getSupportTickets()
      setTickets(Array.isArray(results) ? results : [])
    } catch (err) {
      setError(err.message || 'Failed to load inquiries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  async function resolveTicket(id) {
    try {
      await api.resolveSupportTicket(id)
      await loadAll()
    } catch (err) {
      window.alert(err.message || 'Unable to resolve inquiry')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Inquiries & Support</h2>
        <button onClick={loadAll} style={refreshButton}>Refresh</button>
      </div>
      {error && <div style={errorStyle}>{error}</div>}

      <section style={cardStyle}>
        <div style={sectionTitle}>Admin Inquiries</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={th}>Sender Name</th>
                <th style={th}>Email</th>
                <th style={th}>Sender Address</th>
                <th style={th}>Subject</th>
                <th style={th}>Status</th>
                <th style={th}>Last Activity</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={td}>Loading...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={7} style={{ ...td, color: '#6b7280' }}>No inquiries yet.</td></tr>
              ) : tickets.map(ticket => (
                <tr key={ticket._id || ticket.id}>
                  <td style={td}>{ticket.name}</td>
                  <td style={td}>{ticket.email}</td>
                  <td style={td}>{ticket.senderAddress || '-'}</td>
                  <td style={td}>{ticket.subject || '-'}</td>
                  <td style={td}>{ticket.status}</td>
                  <td style={td}>{new Date(ticket.lastActivityAt || ticket.updatedAt || ticket.createdAt).toLocaleString()}</td>
                  <td style={td}>{ticket.status !== 'resolved' && <button onClick={() => resolveTicket(ticket._id || ticket.id)} style={resolveButton}>Mark Resolved</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const cardStyle = { border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', overflow: 'hidden' }
const sectionTitle = { padding: 12, borderBottom: '1px solid #f3f4f6', fontWeight: 600 }
const th = { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontWeight: 600 }
const td = { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }
const refreshButton = { padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }
const resolveButton = { padding: '6px 10px', border: '1px solid #10b981', background: '#10b981', color: '#fff', borderRadius: 8 }
const errorStyle = { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: 10, borderRadius: 8 }
