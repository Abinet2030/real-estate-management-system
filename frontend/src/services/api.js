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
      'https://images.unsplash.com/photo-1560185008-b033106af2f1?auto=format&w=2400&q=90',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&w=2400&q=90',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&w=2400&q=90',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&w=2400&q=90',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&w=2400&q=90',
    ],
    videos: [],
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
      '/api/uploads/city-view-apartment-01.jpg',
      '/api/uploads/city-view-apartment-02.jpg',
      '/api/uploads/city-view-apartment-03.jpg',
      '/api/uploads/city-view-apartment-04.jpg',
    ],
    videos: [],
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
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&w=2400&q=90',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&w=2400&q=90',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&w=2400&q=90',
      'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&w=2400&q=90',
      'https://images.unsplash.com/photo-1615529162924-f8605388461d?auto=format&w=2400&q=90',
    ],
    videos: [],
    status: 'published',
    createdAt: new Date().toISOString(),
  },
]

function getDemoProperty(id) {
  const property = DEMO_PROPERTIES.find(item => item.id === String(id))
  return property ? {
    ...property,
    ownerId: 'u-owner',
    owner: { name: 'Owner One', email: 'owner@example.com', phone: '+251 900 000 000', role: 'seller' },
    features: ['Private garden', 'Secure parking', 'Balcony', 'Modern kitchen', '24/7 security'],
  } : null
}

// Simple localStorage-backed demo state when running frontend-only
// Bumped to load the expanded ordered photo set in existing frontend-only demos.
const DEMO_STORE_KEY = 'demo:state:v2'
function loadDemoState() {
  try {
    const raw = localStorage.getItem(DEMO_STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  const initial = {
    users: [
      // Demo passwords are "1234" for all seeded users
      { id: 'u-admin', name: 'Demo Admin', email: 'admin@example.com', role: 'admin', password: '1234', status: 'active', createdAt: new Date().toISOString() },
      { id: 'u-owner', name: 'Owner One', email: 'owner@example.com', role: 'owner', password: '1234', status: 'active', createdAt: new Date().toISOString() },
      { id: 'u-buyer', name: 'Buyer One', email: 'buyer@example.com', role: 'buyer', password: '1234', status: 'active', createdAt: new Date().toISOString() },
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
      const email = String(body?.email || '').trim().toLowerCase()
      const password = String(body?.password || '')
      if (!email || !password) throw new Error('Email and password are required')
      const s = getState()
      const user = s.users.find(u => String(u.email||'').toLowerCase() === email)
      if (!user) throw new Error('Invalid email or password')
      const userPass = String(user.password || '1234')
      if (password !== userPass) throw new Error('Invalid email or password')
      // Issue a simple demo token with sub and role so the app can derive id/role
      const payload = btoa(JSON.stringify({ sub: user.id, role: user.role }))
      const token = `demo.${payload}.token`
      return ok({ token, user })
    },
    register: async (body) => {
      const id = genId('u')
      const role = body?.role || 'buyer'
      const user = { id, name: body?.name || 'New User', email: body?.email || `${id}@example.com`, role, password: body?.password || '1234', status: role==='seller'||role==='agent' ? 'pending' : 'active', createdAt: new Date().toISOString() }
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
    getProperties: async (params = {}) => {
      let items = getState().properties
      // owner/agent scoped
      if (params.ownerId) items = items.filter(p => p.ownerId === params.ownerId)
      if (params.agentId) items = items.filter(p => p.agentId === params.agentId)
      // type filter (apartment | house | commercial | land)
      if (params.type) {
        const t = String(params.type).toLowerCase()
        items = items.filter(p => String(p.type||'').toLowerCase() === t)
      }
      // city filter
      if (params.city) {
        const c = String(params.city).toLowerCase()
        items = items.filter(p => String(p?.location?.city||'').toLowerCase().includes(c))
      }
      // price range
      const min = params.minPrice != null && params.minPrice !== '' ? Number(params.minPrice) : null
      const max = params.maxPrice != null && params.maxPrice !== '' ? Number(params.maxPrice) : null
      if (min != null) items = items.filter(p => Number(p.price||0) >= min)
      if (max != null) items = items.filter(p => Number(p.price||0) <= max)
      // bedrooms/bathrooms minimums
      if (params.bedrooms) items = items.filter(p => Number(p.bedrooms||0) >= Number(params.bedrooms))
      if (params.bathrooms) items = items.filter(p => Number(p.bathrooms||0) >= Number(params.bathrooms))
      return ok(items)
    },
    getProperty: async (id) => ok(getState().properties.find(p => p.id === id) || null),
    createProperty: async (body) => {
      const prop = { ...body, id: genId('prop'), status: 'published', createdAt: new Date().toISOString() }
      setState(s => ({ ...s, properties: [prop, ...s.properties] }))
      return ok(prop)
    },
    getPublishedProperties: async () => ok(getState().properties.filter(p => p.status === 'published')),
    getManagedProperties: async () => ok(getState().properties),
    setPropertyFeatured: async (id, featured) => ok(setState(s => ({ ...s, properties: s.properties.map(p => p.id === id ? { ...p, featured } : p) }))),
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
    uploadVideos: async (files) => {
      const items = (files || []).map((_f, idx) => ({
        url: `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`,
        id: genId('vid'),
      }))
      setState(s => ({ ...s, media: [...items, ...s.media] }))
      return ok(items)
    },
  }
}

function buildUrl(path, params, baseUrl = BASE_URL) {
  const isAbsolute = /^https?:\/\//i.test(baseUrl)
  // If absolute URL provided, use it; otherwise route via current origin (Vite proxy)
  const base = isAbsolute ? baseUrl : `${window.location.origin}${baseUrl}`
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

      // If the configured backend host is the same as the web app host,
      // also try the current origin with a local /api prefix.
      if (baseForCheck.origin === window.location.origin) {
        const localApiUrl = new URL(window.location.origin)
        localApiUrl.pathname = `/api/${String(path || '').replace(/^\//, '')}`
        if (!attempts.some(u => u.toString() === localApiUrl.toString())) attempts.push(localApiUrl)
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
              // Prefer a string message, but if the API returns an object in `error`,
              // stringify it so the UI doesn't show the raw "[object Object]" text.
              let candidate = data?.message || listErrors || ''
              if (!candidate && data?.error) {
                candidate = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
              }
              msg = candidate || msg
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
    body: fd,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Note: no Content-Type; browser sets multipart boundary
    },
  })
  if (!res.ok) {
    // If the uploads endpoint is not available (e.g. remote serverless host),
    // fall back to the demo uploader so static/dev flows keep working.
    if (res.status === 404) {
      try {
        return createDemoApi().uploadImages(files)
      } catch (e) {
        throw new Error(`API POST failed: ${res.status}`)
      }
    }
    throw new Error(`API POST failed: ${res.status}`)
  }
  return res.json()
}

async function uploadVideos(files) {
  const url = buildUrl('/uploads/videos')
  const token = localStorage.getItem('auth:token') || ''
  const fd = new FormData()
  ;(files || []).forEach(f => fd.append('files', f))
  const res = await fetch(url.toString(), {
    method: 'POST',
    body: fd,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Note: no Content-Type; browser sets multipart boundary
    },
  })
  if (!res.ok) {
    if (res.status === 404) {
      try {
        return createDemoApi().uploadVideos(files)
      } catch (e) {
        throw new Error(`API POST failed: ${res.status}`)
      }
    }
    throw new Error(`API POST failed: ${res.status}`)
  }
  return res.json()
}

const liveApi = {
  getProperties: (params) => request('/properties', { params }).catch(async (err) => {
    // Fallback to static data.json when no backend is available (deployed static site)
    try {
      const res = await fetch('/data.json')
      if (!res.ok) throw err
      const data = await res.json()
      let items = Array.isArray(data.properties) ? data.properties.slice() : []
      if (params) {
        if (params.ownerId) items = items.filter(p => String(p.ownerId || p.created_by) === String(params.ownerId))
        if (params.agentId) items = items.filter(p => String(p.agentId) === String(params.agentId))
        if (params.type) items = items.filter(p => String(p.type || '').toLowerCase() === String(params.type).toLowerCase())
        if (params.city) items = items.filter(p => String((p.location && p.location.city) || '').toLowerCase().includes(String(params.city).toLowerCase()))
        const min = params.minPrice != null && params.minPrice !== '' ? Number(params.minPrice) : null
        const max = params.maxPrice != null && params.maxPrice !== '' ? Number(params.maxPrice) : null
        if (min != null) items = items.filter(p => Number(p.price || 0) >= min)
        if (max != null) items = items.filter(p => Number(p.price || 0) <= max)
        if (params.bedrooms) items = items.filter(p => Number(p.bedrooms || 0) >= Number(params.bedrooms))
        if (params.bathrooms) items = items.filter(p => Number(p.bathrooms || 0) >= Number(params.bathrooms))
      }
      return items
    } catch (e) {
      throw err
    }
  }),
  getManagedProperties: () => request('/properties/manage').catch(async (err) => {
    // Fallback for static deployments: load properties from data.json and apply any local overrides
    try {
      const res = await fetch('/data.json')
      if (!res.ok) throw err
      const data = await res.json()
      let items = Array.isArray(data.properties) ? data.properties.slice() : []
      // Apply local overrides (e.g., featured flags) stored in localStorage
      try {
        const raw = localStorage.getItem('relstate:overrides:v1') || '{}'
        const overrides = JSON.parse(raw)
        items = items.map(p => ({ ...p, featured: overrides[p.id] !== undefined ? !!overrides[p.id] : !!p.featured }))
      } catch (e) { /* ignore parse errors */ }
      // Apply property-level overrides (saved when updateProperty cannot reach a backend)
      try {
        const propRaw = localStorage.getItem('relstate:property-overrides:v1') || '{}'
        const propOverrides = JSON.parse(propRaw)
        items = items.map(p => ({ ...p, ...(propOverrides[p.id] || {}) }))
      } catch (e) { /* ignore parse errors */ }
      return items
    } catch (e) {
      throw err
    }
  }),
  // The development homepage can render fallback sample cards while the API is offline.
  // Resolve those non-Mongo IDs locally so their “More” links remain usable.
  getProperty: async (id) => {
    const demo = getDemoProperty(id)
    if (demo) return demo
    try {
      const property = await request(`/properties/${id}`)
      // If backend returns a property but it lacks videos, try to merge from public/data.json (static demo)
      try {
        if (property && (!Array.isArray(property.videos) || property.videos.length === 0)) {
          const res = await fetch('/data.json')
          if (res.ok) {
            const data = await res.json()
            const found = Array.isArray(data.properties) ? data.properties.find(p => String(p.id) === String(id)) : null
            if (found && Array.isArray(found.videos) && found.videos.length) {
              return { ...property, videos: found.videos }
            }
          }
        }
      } catch (e) { /* ignore static merge errors */ }
      return property
    } catch (err) {
      try {
        const res = await fetch('/data.json')
        if (!res.ok) throw err
        const data = await res.json()
        if (Array.isArray(data.properties)) return data.properties.find(p => String(p.id) === String(id)) || null
      } catch (e) {
        throw err
      }
      throw err
    }
  },
  getUsers: (params) => request('/users', { params }),
  getAgents: (params) => request('/agents', { params }),
  getAgent: (id) => request(`/agents/${id}`),
  // Auth
  // Disable request timeout for login to avoid UX issues with preview proxies; rely on browser/network errors instead
  login: (body) => request('/auth/login', { method: 'POST', body, timeoutMs: 0 }).catch(async (err) => {
    // Fallback for static deployments: validate against frontend/public/data.json users
    try {
      const res = await fetch('/data.json')
      if (!res.ok) throw err
      const data = await res.json()
      const users = Array.isArray(data.users) ? data.users : []
      const email = String(body?.email || '').trim().toLowerCase()
      const password = String(body?.password || '')
      const found = users.find(u => String(u.email || '').toLowerCase() === email)
      if (!found) throw err
      // Demo fallback: allow password '1234' or empty password for seeded users
      if (password === '1234' || !password) {
        const user = { id: found.id || found._id || 'u-admin', name: found.name || found.displayName || 'Admin', email: found.email, role: found.role || 'admin' }
        const payload = btoa(JSON.stringify({ sub: user.id, role: user.role }))
        const token = `demo.${payload}.token`
        return { token, user }
      }
    } catch (e) {
      // fall through to throw original error
    }
    throw err
  }),
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
  setPropertyFeatured: (id, featured) => request(`/properties/${id}`, { method: 'PATCH', body: { featured } }).catch(async (err) => {
    // Fallback: persist featured flag in localStorage overrides so admin UX works on static site
    try {
      const key = 'relstate:overrides:v1'
      const raw = localStorage.getItem(key) || '{}'
      const obj = JSON.parse(raw)
      obj[id] = !!featured
      localStorage.setItem(key, JSON.stringify(obj))
      return { ok: true }
    } catch (e) {
      throw err
    }
  }),
  updateProperty: (id, body) => request(`/properties/${id}`, { method: 'PATCH', body }).catch(async (err) => {
    // Fallback for static deployments: persist property changes in localStorage so the UI can update
    try {
      const key = 'relstate:property-overrides:v1'
      const raw = localStorage.getItem(key) || '{}'
      const obj = JSON.parse(raw)
      obj[id] = { ...(obj[id] || {}), ...(body || {}) }
      localStorage.setItem(key, JSON.stringify(obj))
      // Return a minimal updated shape compatible with expectations
      return { property: { id, ...(obj[id] || {}) } }
    } catch (e) {
      throw err
    }
  }),
  deleteProperty: (id) => request(`/properties/${id}`, { method: 'DELETE' }),
  getPublishedProperties: () => {
    if (USE_DEMO) return Promise.resolve(DEMO_PROPERTIES)
    return request('/properties/published', { timeoutMs: 2500 }).catch(async (err) => {
      // Fallback for static deployments without a backend: load frontend/public/data.json
      try {
        const res = await fetch('/data.json')
        if (!res.ok) throw err
        const data = await res.json()
        if (Array.isArray(data.properties)) return data.properties.filter(p => p.status === 'published')
      } catch (e) {
        throw err
      }
      throw err
    })
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
  uploadVideos,
}

// Prefer demo API when explicitly requested via env flag
export const api = USE_DEMO ? createDemoApi() : liveApi

export default api
