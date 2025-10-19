const BASE_URL = import.meta.env.VITE_API_URL || '/api'

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

  // Single target: absolute VITE_API_URL if set, otherwise current origin (Vite proxy in dev)
  const attempts = [buildUrl(path, params)]

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

export const api = {
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
  getPublishedProperties: () => request('/properties/published'),
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

export default api
