import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AgentCard from '../components/common/AgentCard'
import api from '../services/api'

export default function Agents() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()

  const params = useMemo(()=> new URLSearchParams(location.search), [location.search])
  const roleParam = (params.get('role')||'').toLowerCase() // owner | agent | ''
  const scopeParam = (params.get('scope')||'').toLowerCase() // international | ''

  const { heading, description } = useMemo(()=>{
    if (roleParam === 'owner') {
      return {
        heading: 'Owners',
        description: 'Browse verified property owners. Connect directly to discuss listings, viewing, and offers.'
      }
    }
    if (roleParam === 'agent') {
      return {
        heading: 'Agents',
        description: 'Find real estate agents and professionals who can assist with buying, selling, and renting.'
      }
    }
    if (scopeParam === 'international') {
      return {
        heading: 'International',
        description: 'Discover professionals offering international services. Availability and coverage may vary.'
      }
    }
    return { heading: 'Agents', description: 'Find real estate professionals to assist you.' }
  }, [roleParam, scopeParam])

  const filtered = useMemo(()=>{
    // Simple client-side filter by role when available on items
    let list = Array.isArray(items) ? [...items] : []
    if (roleParam === 'owner') list = list.filter(x => String(x.role||'').toLowerCase() === 'seller')
    if (roleParam === 'agent') list = list.filter(x => String(x.role||'').toLowerCase() === 'agent')
    // scopeParam currently decorative until backend supports it
    return list
  }, [items, roleParam])

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        let data = []
        if (roleParam === 'owner') {
          const res = await api.getUsers({ role: 'seller', status: 'active' })
          data = Array.isArray(res) ? res : (res?.data || [])
        } else if (scopeParam === 'international') {
          const res = await api.getAgents({ scope: 'international' })
          data = Array.isArray(res) ? res : (res?.data || [])
        } else {
          const res = await api.getAgents()
          data = Array.isArray(res) ? res : (res?.data || [])
        }
        if (!ignore) setItems(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [roleParam, scopeParam])

  return (
    <section style={{ padding: '16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 12 }}>
        <h2>{heading}</h2>
        <p style={{ marginTop: -8, color: '#64748b' }}>{description}</p>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {filtered.map((a) => (
            <AgentCard key={a.id || a._id} agent={a} />
          ))}
        </div>
      </div>
    </section>
  )
}
