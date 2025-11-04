const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const USE_DEMO = String(import.meta.env.VITE_USE_DEMO_DATA || '').toLowerCase() === 'true'

// Minimal demo dataset for frontend-only usage
const DEMO_PROPERTIES = [
  {
    id: 'demo-1',
    title: 'Modern Family House',
    description: 'Spacious 4 bed family home with garden',
    price: 350000,
    currency: 'USD',
    type: 'house',
    bedrooms: 4,
    bathrooms: 3,
    areaSqm: 220,
    location: { city: 'Addis Ababa', region: 'Addis Ababa', country: 'Ethiopia' },
    images: [
      'https://images.unsplash.com/photo-1560185008-b033106af2f1?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1575517111478-7f6dbfbfb9d1?q=80&w=800&auto=format&fit=crop',
    ],
    status: 'published',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: 'City View Apartment',
    description: 'Sunny 2 bed apartment with great views',
    price: 1200,
    currency: 'USD',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 85,
    location: { city: 'Nairobi', region: 'Nairobi', country: 'Kenya' },
    images: [
      'https://images.unsplash.com/photo-1502673530728-f79b4cab31b1?q=80&w=1200&auto=format&fit=crop',
    ],
    status: 'published',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    title: 'Cozy Studio',
    description: 'Perfect starter studio near downtown',
    price: 550,
    currency: 'USD',
    type: 'apartment',
    bedrooms: 0,
    bathrooms: 1,
    areaSqm: 32,
    location: { city: 'Kigali', region: 'Kigali', country: 'Rwanda' },
    images: [
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop',
    ],
    status: 'published',
    createdAt: new Date().toISOString(),
  },
]

// Simple localStorage-backed demo state when running frontend-only
const DEMO_STORE_KEY = 'demo:state:v1'
function loadDemoState() {
  try {
    const raw = localStorage.getItem(DEMO_STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  const initial = {
    users: [
      { id: 'u-admin', name: 'Demo Admin', email: 'admin@example.com', role: 'admin', status: 'active', createdAt: new Date().toISOString() },
      { id: 'u-owner', name: 'Owner One', email: 'owner@example.com', role: 'owner', status: 'active', createdAt: new Date().toISOString() },
      { id: 'u-buyer', name: 'Buyer One', email: 'buyer@example.com', role: 'buyer', status: 'active', createdAt: new Date().toISOString() },
    ],
    agents: [
      { id: 'a-1', name: 'Agent A', email: 'agent@example.com', phone: '+251900000000', status: 'active', createdAt: new Date().toISOString() },
    ],
    properties: DEMO_PROPERTIES.map(p => ({ ...p, ownerId: 'u-owner' })),
    inquiries: [],
    offers: [],
    media: [],
    support: [],
    pendingSellers: [],
    pendingAgents: [],
  }
  localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(initial))
  return initial
}
function saveDemoState(state) {
  localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(state))
}
function genId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function createDemoApi() {
  const getState = () => loadDemoState()
  const setState = (updater) => {
    const s = getState()
    const next = typeof updater === 'function' ? updater(s) : updater
    saveDemoState(next)
    return next
  }

  const ok = (data) => Promise.resolve(data)

  return {
    // Auth
    login: async (body) => {
      const s = getState()
      const user = s.users.find(u => u.email === body?.email) || s.users[0]
      return ok({ token: 'demo-token', user })
    },
    register: async (body) => {
      const id = genId('u')
      const user = { id, name: body?.name || 'New User', email: body?.email || `${id}@example.com`, role: body?.role || 'buyer', status: 'active', createdAt: new Date().toISOString() }
      setState(s => ({ ...s, users: [...s.users, user] }))
      return ok({ token: 'demo-token', user })
    },

    // Users & Agents (admin)
    getUsers: async () => ok(getState().users),
    getAgents: async () => ok(getState().agents),
    getAgent: async (id) => ok(getState().agents.find(a => a.id === id) || null),
    getPendingSellers: async () => ok(getState().pendingSellers),
    getPendingAgents: async () => ok(getState().pendingAgents),
    approveUser: async (id) => ok(setState(s => { const user = s.users.find(u => u.id === id); if (user) user.status = 'active'; return { ...s } })),
    rejectUser: async (id) => ok(setState(s => { const user = s.users.find(u => u.id === id); if (user) user.status = 'inactive'; return { ...s } })),
    deleteUser: async (id) => ok(setState(s => ({ ...s, users: s.users.filter(u => u.id !== id) }))),
    setUserActive: async (id) => ok(setState(s => { const user = s.users.find(u => u.id === id); if (user) user.status = 'active'; return { ...s } })),
    setUserInactive: async (id) => ok(setState(s => { const user = s.users.find(u => u.id === id); if (user) user.status = 'inactive'; return { ...s } })),

    // Properties
    getProperties: async (params) => {
      let items = getState().properties
      if (params?.ownerId) items = items.filter(p => p.ownerId === params.ownerId)
      return ok(items)
    },
    getProperty: async (id) => ok(getState().properties.find(p => p.id === id) || null),
    createProperty: async (body) => {
      const prop = { ...body, id: genId('prop'), status: 'published', createdAt: new Date().toISOString() }
      setState(s => ({ ...s, properties: [prop, ...s.properties] }))
      return ok(prop)
    },
    getPublishedProperties: async () => ok(getState().properties.filter(p => p.status === 'published')),
    getPropertiesByOwner: async (ownerId) => ok(getState().properties.filter(p => p.ownerId === ownerId)),

    // Inquiries
    getInquiries: async (ownerId) => ok(ownerId ? getState().inquiries.filter(i => i.ownerId === ownerId) : getState().inquiries),
    getBuyerInquiries: async (buyerEmail) => ok(getState().inquiries.filter(i => i.buyerEmail === buyerEmail)),
    getOwnerInquiries: async (ownerId) => ok(getState().inquiries.filter(i => i.ownerId === ownerId)),
    getAllInquiries: async () => ok(getState().inquiries),
    getInquiry: async (id) => ok(getState().inquiries.find(i => i.id === id) || null),
    createInquiry: async (body) => {
      const item = { id: genId('inq'), ...body, messages: [], archived: false, createdAt: new Date().toISOString() }
      setState(s => ({ ...s, inquiries: [item, ...s.inquiries] }))
      return ok(item)
    },
    replyInquiry: async (id, text, attachments = []) => ok(setState(s => {
      const i = s.inquiries.find(x => x.id === id)
      if (i) (i.messages || (i.messages = [])).push({ id: genId('msg'), text, attachments, sender: 'owner', createdAt: new Date().toISOString() })
      return { ...s }
    })) ,
    sendInquiryMessage: async (id, text, attachments = [], sender = 'admin') => ok(setState(s => {
      const i = s.inquiries.find(x => x.id === id)
      if (i) (i.messages || (i.messages = [])).push({ id: genId('msg'), text, attachments, sender, createdAt: new Date().toISOString() })
      return { ...s }
    })) ,
    archiveInquiry: async (id) => ok(setState(s => { const i = s.inquiries.find(x => x.id === id); if (i) i.archived = true; return { ...s } })),
    markInquiryRead: async (_id, _role) => ok(true),

    // Support tickets
    createSupportTicket: async (body) => {
      const t = { id: genId('sup'), status: 'open', ...body, createdAt: new Date().toISOString() }
      setState(s => ({ ...s, support: [t, ...s.support] }))
      return ok(t)
    },
    getSupportTickets: async () => ok(getState().support),
    resolveSupportTicket: async (id) => ok(setState(s => { const t = s.support.find(x => x.id === id); if (t) t.status = 'resolved'; return { ...s } })),

    // Offers
    getOffers: async (ownerId) => ok(ownerId ? getState().offers.filter(o => o.ownerId === ownerId) : getState().offers),
    acceptOffer: async (id) => ok(setState(s => { const o = s.offers.find(x => x.id === id); if (o) o.status = 'accepted'; return { ...s } })),
    rejectOffer: async (id) => ok(setState(s => { const o = s.offers.find(x => x.id === id); if (o) o.status = 'rejected'; return { ...s } })),
    counterOffer: async (id, amount) => ok(setState(s => { const o = s.offers.find(x => x.id === id); if (o) { o.status = 'countered'; o.counterAmount = amount; } return { ...s } })),

    // Media
    getMedia: async (ownerId) => ok(ownerId ? getState().media.filter(m => m.ownerId === ownerId) : getState().media),

    // Uploads (fake)
    uploadImages: async (files) => {
      const items = (files || []).map((_f, idx) => ({
        url: `https://picsum.photos/seed/${Date.now()}_${idx}/800/600`,
        id: genId('img'),
      }))
      setState(s => ({ ...s, media: [...items, ...s.media] }))
      return ok(items)
    },
  }
}

function buildUrl(path, params) {
  const isAbsolute = /^https?:\/\//i.test(BASE_URL)
  // If absolute URL provided, use it; otherwise route via current origin (Vite proxy)
  const base = isAbsolute ? BASE_URL : `${window.location.origin}${BASE_URL}`
  const url = new URL(base)
  // Preserve base path and append the request path safely
  const cleanedBasePath = url.pathname.replace(/\/$/, '')
  const cleanedPath = String(path || '').replace(/^\//, '')
  url.pathname = `${cleanedBasePath}/${cleanedPath}`
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, v)
    })
  }
  return url
}

async function request(path, { method = 'GET', params, body, timeoutMs = 8000 } = {}) {
  const token = localStorage.getItem('auth:token') || ''

  // Build primary attempt
  const attempts = [buildUrl(path, params)]
  // Resilient fallback: if an absolute VITE_API_URL is provided but does not end with '/api',
  // retry by prefixing the request path with 'api/'. This covers cases where the server mounts API under '/api'.
  try {
    const isAbsoluteBase = /^https?:\/\//i.test(BASE_URL)
    if (isAbsoluteBase) {
      const baseForCheck = new URL(BASE_URL)
      const baseEndsWithApi = baseForCheck.pathname.replace(/\/$/, '').endsWith('/api')
      if (!baseEndsWithApi) {
        const altPath = `/api/${String(path || '').replace(/^\//, '')}`
        const altUrl = buildUrl(altPath, params)
        // Avoid duplicate if it happens to be identical
        if (!attempts.some(u => u.toString() === altUrl.toString())) attempts.push(altUrl)
      }
    }
  } catch {
    // ignore URL construction errors; we'll proceed with primary attempt only
  }

  let lastErr
  for (const url of attempts) {
    const useTimeout = Number(timeoutMs) > 0
    const ctrl = useTimeout ? new AbortController() : undefined
    const perTry = useTimeout ? Math.max(2500, Math.floor(timeoutMs / attempts.length)) : 0
    const t = useTimeout ? setTimeout(() => ctrl.abort(), perTry) : null
      try {
        const res = await fetch(url.toString(), {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: ctrl?.signal,
        })
        if (!res.ok) {
          let msg = `API ${method} failed: ${res.status}`
          try {
            const ct = res.headers.get('content-type') || ''
            if (ct.includes('application/json')) {
              const data = await res.json()
              const listErrors = Array.isArray(data?.errors)
                ? data.errors.map(e => (typeof e === 'string' ? e : e?.message || JSON.stringify(e))).join(', ')
                : ''
              msg = data?.message || data?.error || listErrors || msg
            } else {
              const text = await res.text()
              if (text) msg = text
            }
          } catch {
            // ignore parse errors; keep default message
          }
          const err = new Error(msg)
          // attach status for programmatic handling
          err.status = res.status
          throw err
        }
        // Validate content-type to avoid "Unexpected token <" when HTML is returned
        const ct = res.headers.get('content-type') || ''
        if (!ct.includes('application/json')) {
          const text = await res.text()
          const preview = (text || '').slice(0, 200)
          throw new Error(`Expected JSON but received ${ct || 'unknown content-type'}. Preview: ${preview}`)
        }
        return await res.json()
      } catch (e) {
        lastErr = e?.name === 'AbortError' ? new Error('Request timed out') : e
        // try next
      } finally {
        if (t) clearTimeout(t)
      }
  }
  throw lastErr || new Error('API request failed')
}
async function uploadImages(files) {
  const url = buildUrl('/uploads/images')
  const token = localStorage.getItem('auth:token') || ''
  const fd = new FormData()
  ;(files || []).forEach(f => fd.append('files', f))
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Note: no Content-Type; browser sets multipart boundary
    },
  })
  if (!res.ok) throw new Error(`API POST failed: ${res.status}`)
  return res.json()
}

const liveApi = {
  getProperties: (params) => request('/properties', { params }),
  getProperty: (id) => request(`/properties/${id}`),
  getUsers: (params) => request('/users', { params }),
  getAgents: (params) => request('/agents', { params }),
  getAgent: (id) => request(`/agents/${id}`),
  // Auth
  // Disable request timeout for login to avoid UX issues with preview proxies; rely on browser/network errors instead
  login: (body) => request('/auth/login', { method: 'POST', body, timeoutMs: 0 }),
  register: (body) => request('/auth/register', { method: 'POST', body, timeoutMs: 0 }),
  // Admin approvals
  getPendingSellers: () => request('/users/pending-sellers'),
  getPendingAgents: () => request('/users/pending-agents'),
  approveUser: (id) => request(`/users/${id}/approve`, { method: 'POST' }),
  rejectUser: (id) => request(`/users/${id}/reject`, { method: 'POST' }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  setUserActive: (id) => request(`/users/${id}/approve`, { method: 'POST' }),
  setUserInactive: (id) => request(`/users/${id}/reject`, { method: 'POST' }),
  // Properties
  createProperty: (body) => request('/properties', { method: 'POST', body }),
  getPublishedProperties: () => {
    if (USE_DEMO) return Promise.resolve(DEMO_PROPERTIES)
    return request('/properties/published')
  },
  getPropertiesByOwner: (ownerId) => request('/properties/by-owner', { params: { ownerId } }),
  // Inquiries
  // Backwards-compat helpers used by some components
  getInquiries: (ownerId) => request('/inquiries', { params: { ownerId } }),
  getBuyerInquiries: (buyerEmail) => request('/inquiries', { params: { buyerEmail } }),
  getOwnerInquiries: (ownerId) => request('/inquiries', { params: { ownerId } }),
  getAllInquiries: () => request('/inquiries', { params: { all: 1 } }),
  getInquiry: (id) => request(`/inquiries/${id}`),
  replyInquiry: (id, text, attachments = []) => request(`/inquiries/${id}/messages`, { method: 'POST', body: { text, attachments, sender: 'owner' } }),
  archiveInquiry: (id) => request(`/inquiries/${id}/archive`, { method: 'POST' }),
  markInquiryRead: (id, role) => request(`/inquiries/${id}/read`, { method: 'POST', body: { role } }),
  sendInquiryMessage: (id, text, attachments = [], sender = 'admin') => request(`/inquiries/${id}/messages`, { method: 'POST', body: { text, attachments, sender } }),
  createInquiry: (body) => request('/inquiries', { method: 'POST', body }),
  // Support tickets
  createSupportTicket: (body) => request('/support', { method: 'POST', body }),
  getSupportTickets: (params) => request('/support', { params }),
  resolveSupportTicket: (id) => request(`/support/${id}/resolve`, { method: 'POST' }),
  getOffers: (ownerId) => request('/offers', { params: { ownerId } }),
  acceptOffer: (id) => request(`/offers/${id}/accept`, { method: 'POST' }),
  rejectOffer: (id) => request(`/offers/${id}/reject`, { method: 'POST' }),
  counterOffer: (id, amount) => request(`/offers/${id}/counter`, { method: 'POST', body: { amount } }),
  // Media
  getMedia: (ownerId) => request('/media', { params: ownerId ? { ownerId } : undefined }),
  // Uploads
  uploadImages,
}

// Prefer demo API when explicitly requested via env flag
export const api = USE_DEMO ? createDemoApi() : liveApi

export default api
