import { useEffect, useRef, useState } from 'react'
import AdminTopBar from '../components/AdminTopBar.jsx'
import Home from './Home.jsx'
import AdminInquiries from '../components/AdminInquiries.jsx'
import AdminSidebar from '../components/AdminSidebar.jsx'
import api from '../services/api'

export default function AdminDashboard() {
  const [active, setActive] = useState('overview') // overview | users | listings | reports | settings
  const [pending, setPending] = useState([])
  const [pendingAgents, setPendingAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [uRole, setURole] = useState('') // '', buyer, seller, agent, admin
  const [uStatus, setUStatus] = useState('') // '', active, pending, rejected
  const [uLoading, setULoading] = useState(false)
  const [onlyOwnersAgents, setOnlyOwnersAgents] = useState(true) // default show Owners & Agents first

  // Reports state
  const [kpi, setKpi] = useState({ totalUsers: 0, owners: 0, agents: 0, pendingApprovals: 0, publishedListings: 0 })
  const [recentUsers, setRecentUsers] = useState([])
  const [roleDist, setRoleDist] = useState({ buyer: 0, seller: 0, agent: 0, admin: 0 })
  const [signups7d, setSignups7d] = useState([]) // [{ label, count }]
  // Overview state
  const [ovKpi, setOvKpi] = useState({ totalUsers: 0, owners: 0, agents: 0, pendingApprovals: 0, publishedListings: 0 })
  const [ovUpdatedAt, setOvUpdatedAt] = useState('')
  const [overviewQuery, setOverviewQuery] = useState('')
  const previewRef = useRef(null)

  async function loadPending() {
    try {
      setError('')
      setLoading(true)
      const [sellers, agents] = await Promise.all([
        api.getPendingSellers().catch(()=>[]),
        api.getPendingAgents().catch(()=>[]),
      ])
      setPending(Array.isArray(sellers) ? sellers : [])
      setPendingAgents(Array.isArray(agents) ? agents : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPending() }, [])

  async function loadUsers() {
    try {
      setULoading(true)
      const params = {}
      if (uRole) params.role = uRole
      if (uStatus) params.status = uStatus
      const list = await api.getUsers(params)
      setUsers(Array.isArray(list) ? list : [])
    } catch (e) {
      // reuse error box slot
      setError(e.message)
    } finally {
      setULoading(false)
    }
  }
  useEffect(() => {
    if (active === 'users') {
      loadUsers()
    }
  }, [active, uRole, uStatus])

  // Listen for admin topbar search to filter Overview in place
  useEffect(() => {
    function onAdminSearch(e) {
      const q = String(e?.detail?.q || '')
      setOverviewQuery(q)
      setActive('overview')
      // scroll to preview after a tick
      setTimeout(() => {
        try { previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {}
      }, 50)
    }
    window.addEventListener('admin:search', onAdminSearch)
    return () => window.removeEventListener('admin:search', onAdminSearch)
  }, [])

  async function loadOverview() {
    try {
      const [allUsers, owners, agents, pendSellers, pendAgents, published] = await Promise.all([
        api.getUsers({}).catch(()=>[]),
        api.getUsers({ role: 'seller' }).catch(()=>[]),
        api.getUsers({ role: 'agent' }).catch(()=>[]),
        api.getPendingSellers().catch(()=>[]),
        api.getPendingAgents().catch(()=>[]),
        api.getPublishedProperties().catch(()=>[]),
      ])
      const totalUsers = Array.isArray(allUsers) ? allUsers.length : 0
      const ownersCount = Array.isArray(owners) ? owners.length : 0
      const agentsCount = Array.isArray(agents) ? agents.length : 0
      const pendingApprovals = (Array.isArray(pendSellers) ? pendSellers.length : 0) + (Array.isArray(pendAgents) ? pendAgents.length : 0)
      const publishedListings = Array.isArray(published) ? published.length : 0
      setOvKpi({ totalUsers, owners: ownersCount, agents: agentsCount, pendingApprovals, publishedListings })
      setOvUpdatedAt(new Date().toLocaleString())
    } catch {
      // keep overview silent
    }
  }
  useEffect(() => {
    if (active === 'overview') {
      loadOverview()
    }
  }, [active])

  async function loadReports() {
    try {
      setError('')
      // Parallel fetches for speed
      const [allUsers, owners, agents, pendSellers, pendAgents, published] = await Promise.all([
        api.getUsers({}).catch(()=>[]),
        api.getUsers({ role: 'seller' }).catch(()=>[]),
        api.getUsers({ role: 'agent' }).catch(()=>[]),
        api.getPendingSellers().catch(()=>[]),
        api.getPendingAgents().catch(()=>[]),
        api.getPublishedProperties().catch(()=>[]),
      ])
      const totalUsers = Array.isArray(allUsers) ? allUsers.length : 0
      const ownersCount = Array.isArray(owners) ? owners.length : 0
      const agentsCount = Array.isArray(agents) ? agents.length : 0
      const pendingApprovals = (Array.isArray(pendSellers) ? pendSellers.length : 0) + (Array.isArray(pendAgents) ? pendAgents.length : 0)
      const publishedListings = Array.isArray(published) ? published.length : 0
      setKpi({ totalUsers, owners: ownersCount, agents: agentsCount, pendingApprovals, publishedListings })
      const all = Array.isArray(allUsers) ? allUsers : []
      // Recent 10 registrations
      const sorted = all.slice().sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0))
      setRecentUsers(sorted.slice(0,10))
      // Role distribution
      const rd = { buyer: 0, seller: 0, agent: 0, admin: 0 }
      for (const u of all) { const r = String(u.role||'').toLowerCase(); if (rd[r] !== undefined) rd[r] += 1 }
      setRoleDist(rd)
      // 7-day signups (by local date)
      const today = new Date()
      const days = []
      for (let i=6;i>=0;i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const label = d.toLocaleDateString(undefined, { month:'short', day:'2-digit' })
        days.push({ key: d.toISOString().slice(0,10), label, count: 0 })
      }
      const map = new Map(days.map(x => [x.key, x]))
      for (const u of all) {
        const dt = new Date(u.createdAt || u.updatedAt || Date.now())
        const key = dt.toISOString().slice(0,10)
        if (map.has(key)) map.get(key).count += 1
      }
      setSignups7d(days)
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => {
    if (active === 'reports') {
      loadReports()
    }
  }, [active])

  async function approve(id) {
    await api.approveUser(id)
    await loadPending()
  }
  async function reject(id) {
    await api.rejectUser(id)
    await loadPending()
  }
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <AdminSidebar activeKey={active} onSelect={(k) => setActive(k)} />
      <div style={{ marginLeft: 240, display: 'grid', gridTemplateRows: 'auto 1fr' }}>
        <AdminTopBar />
        <main style={{ padding: '24px 16px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 16 }}>
            {active === 'overview' && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
                  <span style={{ color: '#6b7280', fontSize: 12 }}>Overview • Updated {ovUpdatedAt || '—'}</span>
                </div>

                {/* Home page preview */}
                <section style={{ marginTop: 8 }} ref={previewRef}>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    <Home q={overviewQuery} />
                  </div>
                </section>
              </>
            )}

            {active === 'listings' && (
              <>
                <section style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ margin: 0 }}>Pending Sellers</h3>
                    <button onClick={loadPending} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Refresh</button>
                  </div>
                  {error && <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={th}>Name</th>
                          <th style={th}>Email</th>
                          <th style={th}>Phone</th>
                          <th style={th}>Requested</th>
                          <th style={th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center' }}>Loading...</td></tr>
                        ) : pending.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No pending sellers</td></tr>
                        ) : (
                          pending.map(u => (
                            <tr key={u.id || u._id}>
                              <td style={td}>{u.name}</td>
                              <td style={td}>{u.email}</td>
                              <td style={td}>{u.phone || '-'}</td>
                              <td style={td}>{new Date(u.createdAt || Date.now()).toLocaleString()}</td>
                              <td style={{ ...td }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => approve(u.id || u._id)} style={btnPrimary}>Approve</button>
                                  <button onClick={() => reject(u.id || u._id)} style={btnDanger}>Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ margin: 0 }}>Pending Agents</h3>
                    <button onClick={loadPending} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Refresh</button>
                  </div>
                  {error && <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={th}>Name</th>
                          <th style={th}>Email</th>
                          <th style={th}>Phone</th>
                          <th style={th}>Agent Code</th>
                          <th style={th}>Requested</th>
                          <th style={th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center' }}>Loading...</td></tr>
                        ) : pendingAgents.length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No pending agents</td></tr>
                        ) : (
                          pendingAgents.map(u => (
                            <tr key={u.id || u._id}>
                              <td style={td}>{u.name}</td>
                              <td style={td}>{u.email}</td>
                              <td style={td}>{u.phone || '-'}</td>
                              <td style={td}>{u.agentCode || '-'}</td>
                              <td style={td}>{new Date(u.createdAt || Date.now()).toLocaleString()}</td>
                              <td style={{ ...td }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => approve(u.id || u._id)} style={btnPrimary}>Approve</button>
                                  <button onClick={() => reject(u.id || u._id)} style={btnDanger}>Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {active === 'users' && (
              <>
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <h3 style={{ margin: 0 }}>Users Management</h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <label style={{ fontSize: 13, color: '#374151' }}>Role</label>
                      <select value={uRole} onChange={e=>setURole(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                        <option value="">All</option>
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                      <label style={{ fontSize: 13, color: '#374151' }}>Status</label>
                      <select value={uStatus} onChange={e=>setUStatus(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                        <option value="">All</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Inactive</option>
                      </select>
                      <button onClick={loadUsers} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Refresh</button>
                    </div>
                  </div>
                  {error && <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: 8, margin: '12px 0' }}>{error}</div>}
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={th}>Name</th>
                          <th style={th}>Email</th>
                          <th style={th}>Role</th>
                          <th style={th}>Status</th>
                          <th style={th}>Created</th>
                          <th style={th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uLoading ? (
                          <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center' }}>Loading...</td></tr>
                        ) : users.length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No users</td></tr>
                        ) : (
                          users.map(u => {
                            const id = u.id || u._id
                            const status = String(u.status || '').toLowerCase()
                            const canActivate = status !== 'active'
                            const canInactivate = status !== 'rejected'
                            return (
                              <tr key={id}>
                                <td style={td}>{u.name}</td>
                                <td style={td}>{u.email}</td>
                                <td style={td}>{u.role}</td>
                                <td style={td}>{u.status}</td>
                                <td style={td}>{new Date(u.createdAt || Date.now()).toLocaleString()}</td>
                                <td style={{ ...td }}>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button disabled={!canActivate} onClick={async()=>{ await api.setUserActive(id); await loadUsers() }} style={btnPrimary}>Activate</button>
                                    <button disabled={!canInactivate} onClick={async()=>{ await api.setUserInactive(id); await loadUsers() }} style={btnSecondary}>Inactivate</button>
                                    <button onClick={async()=>{ if (confirm('Delete this user?')) { await api.deleteUser(id); await loadUsers() } }} style={btnDanger}>Delete</button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
            {active === 'reports' && (
              <>
                <section>
                  <h3 style={{ margin: 0 }}>Key Metrics</h3>
                  {error && <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: 8, margin: '12px 0' }}>{error}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
                    <KpiCard label="Total Users" value={kpi.totalUsers} />
                    <KpiCard label="Owners" value={kpi.owners} />
                    <KpiCard label="Agents" value={kpi.agents} />
                    <KpiCard label="Pending Approvals" value={kpi.pendingApprovals} />
                    <KpiCard label="Published Listings" value={kpi.publishedListings} />
                  </div>
                </section>

                <section style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>Recent Registrations</h3>
                    <button onClick={loadReports} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Refresh</button>
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff', marginTop: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={th}>Name</th>
                          <th style={th}>Email</th>
                          <th style={th}>Role</th>
                          <th style={th}>Status</th>
                          <th style={th}>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentUsers.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No recent registrations</td></tr>
                        ) : (
                          recentUsers.map(u => (
                            <tr key={u.id || u._id}>
                              <td style={td}>{u.name}</td>
                              <td style={td}>{u.email}</td>
                              <td style={td}>{u.role}</td>
                              <td style={td}>{u.status}</td>
                              <td style={td}>{new Date(u.createdAt || Date.now()).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section style={{ marginTop: 16 }}>
                  <h3 style={{ margin: 0 }}>Role Distribution</h3>
                  <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12, marginTop:8 }}>
                    <BarChart
                      data={[
                        { label: 'Buyers', value: roleDist.buyer, color: '#60a5fa' },
                        { label: 'Owners', value: roleDist.seller, color: '#34d399' },
                        { label: 'Agents', value: roleDist.agent, color: '#f59e0b' },
                        { label: 'Admins', value: roleDist.admin, color: '#ef4444' },
                      ]}
                      height={160}
                    />
                  </div>
                </section>

                <section style={{ marginTop: 16 }}>
                  <h3 style={{ margin: 0 }}>Signups (Last 7 Days)</h3>
                  <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12, marginTop:8 }}>
                    <LineChart
                      points={signups7d.map((d, i) => ({ x: i, label: d.label, y: d.count }))}
                      height={180}
                    />
                  </div>
                </section>
              </>
            )}
            {active === 'settings' && (
              <div style={{ color: '#6b7280' }}>Settings coming soon.</div>
            )}
            {active === 'inquiries' && (
              <>
                <section style={{ marginTop: 8 }}>
                  <AdminInquiries />
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function Card({ title, desc }) {
  return (
    <article style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ color: '#6b7280' }}>{desc}</div>
      <button style={{ marginTop: 12, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Open</button>
    </article>
  )
}

const th = { textAlign: 'left', padding: 12, fontSize: 13, color: '#374151', borderBottom: '1px solid #e5e7eb' }
const td = { padding: 12, borderBottom: '1px solid #f3f4f6', fontSize: 14 }
const btnPrimary = { padding: '6px 10px', borderRadius: 8, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', cursor: 'pointer' }
const btnSecondary = { padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#111827', cursor: 'pointer' }
const btnDanger = { padding: '6px 10px', borderRadius: 8, border: '1px solid #ef4444', background: '#fff', color: '#b91c1c', cursor: 'pointer' }

// ----- Simple presentational components for Reports -----
function KpiCard({ label, value }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', padding: 16 }}>
      <div style={{ fontSize: 13, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{Number(value || 0).toLocaleString()}</div>
    </div>
  )
}

function BarChart({ data = [], height = 160 }) {
  const pad = 24
  const w = 520
  const h = height
  const max = Math.max(1, ...data.map(d => d.value || 0))
  const bw = Math.max(20, Math.floor((w - pad * 2) / Math.max(1, data.length)))
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Bar chart">
      <rect x="0" y="0" width={w} height={h} fill="#ffffff" />
      {data.map((d, i) => {
        const x = pad + i * bw
        const barH = Math.round((h - pad * 2) * (Number(d.value || 0) / max))
        const y = h - pad - barH
        return (
          <g key={i}>
            <rect x={x + 4} y={y} width={bw - 8} height={barH} fill={d.color || '#3b82f6'} rx="6" />
            <text x={x + bw / 2} y={h - 6} textAnchor="middle" fontSize="10" fill="#374151">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ points = [], height = 180 }) {
  const pad = 24
  const w = 520
  const h = height
  const maxY = Math.max(1, ...points.map(p => p.y || 0))
  const minY = 0
  const n = Math.max(1, points.length - 1)
  const stepX = (w - pad * 2) / Math.max(1, points.length - 1)
  const toX = i => pad + i * stepX
  const toY = y => pad + (h - pad * 2) * (1 - (Number(y || 0) - minY) / (maxY - minY))
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.y)}`).join(' ')
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Line chart">
      <rect x="0" y="0" width={w} height={h} fill="#ffffff" />
      <path d={d} fill="none" stroke="#10b981" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(p.y)} r="3" fill="#10b981" />
          <text x={toX(i)} y={h - 6} textAnchor="middle" fontSize="10" fill="#374151">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}
