import { useEffect, useRef, useState } from 'react'
import AdminTopBar from '../components/AdminTopBar.jsx'
import Home from './Home.jsx'
import AdminInquiries from '../components/AdminInquiries.jsx'
import AdminSidebar from '../components/AdminSidebar.jsx'
import api from '../services/api'
import { AddListingForm } from './SellerDashboard.jsx'
import { getPageCopy, savePageCopy } from '../services/siteContent'

export default function AdminDashboard() {
  const [active, setActive] = useState('overview') // overview | users | listings | reports | settings
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
      <AdminSidebar activeKey={active} onSelect={(k) => setActive(k)} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="content-with-sidebar" style={{ display: 'grid', gridTemplateRows: 'auto 1fr' }}>
        <button
          className="only-mobile"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open admin menu"
          style={{ position: 'fixed', top: 14, left: 14, zIndex: 40, padding: '8px 10px', border: 'none', borderRadius: 8, background: '#0f172a', color: '#fff', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' }}
        >
          Menu
        </button>
        <AdminTopBar />
        <main style={{ padding: '24px 16px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 16 }}>
            {active === 'overview' && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <textarea name="images" value={images.join('\n')} onChange={event => setImages(event.target.value.split(/\r?\n|,/).map(url => url.trim()).filter(Boolean))} style={{ ...editInput, minHeight: 90, marginTop: 5 }} /></label>
          {uploadError && <p style={{ margin: '6px 0 0', color: '#b91c1c', fontSize: 13 }}>{uploadError}</p>}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <span style={{ color: '#475569', fontSize: 13 }}>Virtual tour videos</span>
              <label style={{ ...btnSecondary, cursor: uploading ? 'wait' : 'pointer' }}>{uploading ? 'Uploading…' : 'Upload videos'}
                <input type="file" accept="video/*" multiple disabled={uploading} style={{ display: 'none' }} onChange={event => { const files = Array.from(event.target.files || []); if (files.length) { setUploading(true); setUploadError(''); api.uploadVideos(files).then(result => { const urls = result?.urls || []; setVideos(prev => [...new Set([...(prev||[]), ...urls])]); }).catch(e => setUploadError(e.message || 'Unable to upload videos.')).finally(() => setUploading(false)); } event.target.value = '' }} />
              </label>
            </div>
            <label style={{ color: '#475569', fontSize: 13 }}>Video URLs: one URL per line
              <textarea name="videos" defaultValue={(property.videos||[]).join('\n')} style={{ ...editInput, minHeight: 90, marginTop: 5 }} /></label>
          </div>
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
            {active === 'add-property' && <AddListingForm onCreated={() => setActive('listings')} />}
            {active === 'featured' && <FeaturedPropertyManager />}
            {active === 'edit-home' && <PageCopyEditor page="home" title="Edit Home Page" />}
            {active === 'edit-about' && <PageCopyEditor page="about" title="Edit About Page" />}
          </div>
        </main>
      </div>
    </div>
  )
}

function FeaturedPropertyManager() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  async function load() {
    try { setLoading(true); setError(''); setProperties(await api.getManagedProperties()) } catch (err) { setError(err.message || 'Unable to load properties.') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  const featuredCount = properties.filter(property => property.featured).length
  async function toggle(property) {
    const next = !property.featured
    try {
      setError('')
      await api.setPropertyFeatured(property.id || property._id, next)
      setProperties(current => current.map(item => (item.id || item._id) === (property.id || property._id) ? { ...item, featured: next } : item))
    } catch (err) { setError(err.message || 'Unable to update featured status.') }
  }
  async function remove(property) {
    const id = property.id || property._id
    if (!window.confirm(`Permanently delete “${property.title}”? This cannot be undone.`)) return
    try {
      setError('')
      await api.deleteProperty(id)
      setProperties(current => current.filter(item => (item.id || item._id) !== id))
    } catch (err) { setError(err.message || 'Unable to delete property.') }
  }
  async function saveEdit(event) {
    event.preventDefault()
    try {
      setError('')
      console.log('[admin] saveEdit invoked')
      const form = new FormData(event.currentTarget)
      // Log form entries for debugging
      for (const pair of form.entries()) console.log('[admin] form', pair[0], pair[1])
      const id = editing.id || editing._id
      const changes = {
        title: form.get('title'), description: form.get('description'), price: Number(form.get('price')),
        currency: form.get('currency'), type: form.get('type'), bedrooms: Number(form.get('bedrooms') || 0),
        bathrooms: Number(form.get('bathrooms') || 0), areaSqm: Number(form.get('areaSqm') || 0),
        location: { city: form.get('city'), region: form.get('region'), country: form.get('country') },
        images: String(form.get('images') || '').split(/\r?\n|,/).map(item => item.trim()).filter(Boolean),
        videos: String(form.get('videos') || '').split(/\r?\n|,/).map(item => item.trim()).filter(Boolean),
      }
      const status = form.get('status')
      if (typeof status === 'string' && status) changes.status = status
      const updated = await api.updateProperty(id, changes)
      console.log('[admin] api.updateProperty result', updated)
      setProperties(current => current.map(item => (item.id || item._id) === id ? updated.property : item))
      setEditing(null)
    } catch (err) { setError(err.message || 'Unable to save property changes.') }
  }
  return <section style={{ maxWidth: 900 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><div><h2 style={{ margin: 0 }}>Featured Properties</h2><p style={{ color: '#6b7280', marginBottom: 0 }}>Select published listings to show on the Home page. Selected: {featuredCount}</p></div><button onClick={load} style={btnSecondary}>Refresh</button></div>
    {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
    {loading ? <p>Loading properties…</p> : properties.length === 0 ? <p style={{ color: '#6b7280', padding: 16, border: '1px dashed #cbd5e1', borderRadius: 10 }}>No properties found.</p> : <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}><thead><tr style={{ background: '#f8fafc' }}><th style={tableCell}>Name</th><th style={tableCell}>Price</th><th style={tableCell}>Status</th><th style={tableCell}>Featured</th><th style={tableCell}>Actions</th></tr></thead><tbody>{properties.map(property => <tr key={property.id || property._id}><td style={tableCell}><strong>{property.title}</strong></td><td style={tableCell}>{property.currency || 'USD'} {Number(property.price || 0).toLocaleString()}</td><td style={tableCell}>{property.status}</td><td style={tableCell}>{property.featured ? 'Yes' : 'No'}</td><td style={tableCell}><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button onClick={() => setEditing(property)} style={btnSecondary}>Edit</button><button onClick={() => toggle(property)} style={property.featured ? btnPrimary : btnSecondary}>{property.featured ? 'Remove Featured' : 'Add Featured'}</button><button onClick={() => remove(property)} style={btnDanger}>Delete Permanently</button></div></td></tr>)}</tbody></table></div>}
    {editing && <div role="dialog" aria-modal="true" aria-label="Edit property" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(null) }} style={editOverlay}><div style={editModal}><PropertyEditForm property={editing} onSave={saveEdit} onCancel={() => setEditing(null)} /></div></div>}
  </section>
}

function PropertyEditForm({ property, onSave, onCancel }) {
  const location = property.location || {}
  const [images, setImages] = useState(() => propertyImageUrls(property))
  const [videos, setVideos] = useState(() => (Array.isArray(property.videos) ? property.videos : []))
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  async function addImages(files) {
    if (!files.length) return
    try {
      setUploading(true); setUploadError('')
      const result = await api.uploadImages(files)
      setImages(current => [...new Set([...current, ...(result?.urls || [])])])
    } catch (error) { setUploadError(error.message || 'Unable to upload images.') } finally { setUploading(false) }
  }
  return <form onSubmit={event => { console.log('[admin] PropertyEditForm submit'); onSave(event) }} style={{ display: 'grid', gap: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ margin: 0 }}>Edit Property</h3><button type="button" onClick={onCancel} aria-label="Close edit popup" style={closeButton}>×</button></div><p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>{property.title}</p><div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}><input name="title" defaultValue={property.title} placeholder="Property name" required style={editInput} /><input name="price" type="number" defaultValue={property.price} placeholder="Price" required style={editInput} /><select name="currency" defaultValue={property.currency || 'USD'} style={editInput}><option>USD</option><option>ETB</option><option>EUR</option><option>KES</option><option>RWF</option></select></div><textarea name="description" defaultValue={property.description || ''} placeholder="Description" style={{ ...editInput, minHeight: 70 }} /><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}><input name="type" defaultValue={property.type || 'house'} placeholder="Type" style={editInput} /><input name="bedrooms" type="number" defaultValue={property.bedrooms || 0} placeholder="Bedrooms" style={editInput} /><input name="bathrooms" type="number" defaultValue={property.bathrooms || 0} placeholder="Bathrooms" style={editInput} /><input name="areaSqm" type="number" defaultValue={property.areaSqm || 0} placeholder="Area m²" style={editInput} /></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}><input name="city" defaultValue={location.city || ''} placeholder="City" style={editInput} /><input name="region" defaultValue={location.region || ''} placeholder="Region" style={editInput} /><input name="country" defaultValue={location.country || ''} placeholder="Country" style={editInput} /></div><div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 7 }}><span style={{ color: '#475569', fontSize: 13 }}>Pictures ({images.length})</span><label style={{ ...btnSecondary, cursor: uploading ? 'wait' : 'pointer' }}>{uploading ? 'Uploading…' : 'Upload pictures'}<input type="file" accept="image/*" multiple disabled={uploading} style={{ display: 'none' }} onChange={event => { addImages(Array.from(event.target.files || [])); event.target.value = '' }} /></label></div>{images.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginBottom: 8 }}>{images.map((url, index) => <div key={`${url}-${index}`} style={{ position: 'relative' }}><img src={url} alt={`Property picture ${index + 1}`} style={{ display: 'block', width: '100%', height: 82, objectFit: 'cover', borderRadius: 7, border: '1px solid #cbd5e1' }} /><button type="button" onClick={() => setImages(current => current.filter((_, imageIndex) => imageIndex !== index))} aria-label={`Remove picture ${index + 1}`} style={{ position: 'absolute', top: 4, right: 4, padding: '2px 6px', border: '1px solid #cbd5e1', borderRadius: 5, background: '#fff', cursor: 'pointer' }}>Remove</button></div>)}</div>}<label style={{ color: '#475569', fontSize: 13 }}>Picture URLs: one URL per line<textarea name="images" value={images.join('\n')} onChange={event => setImages(event.target.value.split(/\r?\n|,/).map(url => url.trim()).filter(Boolean))} style={{ ...editInput, minHeight: 90, marginTop: 5 }} /></label>{uploadError && <p style={{ margin: '6px 0 0', color: '#b91c1c', fontSize: 13 }}>{uploadError}</p>}</div><div><button type="submit" style={btnPrimary}>Save Changes</button><button type="button" onClick={onCancel} style={{ ...btnSecondary, marginLeft: 8 }}>Cancel</button></div></form>
}

function propertyImageUrls(property) {
  const urls = []
  const add = value => {
    const url = typeof value === 'string' ? value : value?.url || value?.src
    if (url?.trim() && !urls.includes(url.trim())) urls.push(url.trim())
  }
  ;[property?.images, property?.allImages, property?.imageUrls, property?.photos, property?.media].filter(Array.isArray).forEach(list => list.forEach(add))
  ;[property?.coverImage, property?.coverUrl, property?.image, property?.imageUrl].forEach(add)
  return urls
}

const tableCell = { padding: '12px 10px', borderBottom: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap' }
const editInput = { width: '100%', boxSizing: 'border-box', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 7, font: 'inherit' }
const editOverlay = { position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(15, 23, 42, 0.58)' }
const editModal = { width: 'min(760px, 100%)', maxHeight: '90vh', overflowY: 'auto', padding: 20, borderRadius: 12, background: '#fff', boxShadow: '0 20px 60px rgba(15,23,42,.28)' }
const closeButton = { border: 0, background: 'transparent', color: '#64748b', fontSize: 26, lineHeight: 1, cursor: 'pointer' }

function PageCopyEditor({ page, title }) {
  const [copy, setCopy] = useState(() => getPageCopy(page))
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  function submit(event) { event.preventDefault(); savePageCopy(page, copy); setSaved(true) }
  async function uploadHero(file) {
    if (!file || !file.type.startsWith('image/')) { setUploadError('Please choose an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Hero images must be 5 MB or smaller.'); return }
    try {
      setUploadError(''); setUploading(true)
      const result = await api.uploadImages([file])
      const url = result?.urls?.[0]
      if (!url) throw new Error('No image URL returned')
      setCopy(current => ({ ...current, heroImage: url }))
    } catch (error) { setUploadError(error.message || 'Image upload failed.') } finally { setUploading(false) }
  }
  return <section style={{ maxWidth: 720, padding: 20, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
    <h2 style={{ marginTop: 0 }}>{title}</h2><p style={{ color: '#6b7280' }}>Update the hero text shown on the live page.</p>
    {saved && <p style={{ color: '#15803d' }}>Changes saved. They appear when the page is opened.</p>}
    <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
      <label>Eyebrow text<input required value={copy.kicker} onChange={e => setCopy({ ...copy, kicker: e.target.value })} style={editorInput} /></label>
      <label>Heading<input required value={copy.title} onChange={e => setCopy({ ...copy, title: e.target.value })} style={editorInput} /></label>
      <label>Description<textarea required rows={4} value={copy.description} onChange={e => setCopy({ ...copy, description: e.target.value })} style={editorInput} /></label>
      {page === 'home' && <><label>Hero image URL<input required type="url" value={copy.heroImage || ''} onChange={e => setCopy({ ...copy, heroImage: e.target.value })} placeholder="https://example.com/hero-image.jpg" style={editorInput} /></label>
        <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); uploadHero(event.dataTransfer.files?.[0]) }} style={{ padding: 22, border: '2px dashed #94a3b8', borderRadius: 10, background: '#f8fafc', textAlign: 'center', color: '#475569' }}>
          <strong>{uploading ? 'Uploading image…' : 'Drag and drop a hero image here'}</strong><br />
          <label style={{ display: 'inline-block', marginTop: 10, padding: '8px 12px', borderRadius: 7, background: '#0f172a', color: '#fff', cursor: 'pointer' }}>Browse image<input type="file" accept="image/*" onChange={event => uploadHero(event.target.files?.[0])} style={{ display: 'none' }} /></label>
          <div style={{ marginTop: 8, fontSize: 12 }}>JPG, PNG, or WebP · maximum 5 MB</div>
        </div>
        {copy.heroImage && <img src={copy.heroImage} alt="Hero preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }} />}
        {uploadError && <p style={{ margin: 0, color: '#b91c1c' }}>{uploadError}</p>}</>}
      <button type="submit" style={btnPrimary}>Save page changes</button>
    </form>
  </section>
}

const editorInput = { display: 'block', boxSizing: 'border-box', width: '100%', marginTop: 6, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, font: 'inherit' }

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
