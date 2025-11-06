import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import PropertyCard from '../components/common/PropertyCard'

export default function AgentProfile() {
  const { id } = useParams()
  const [agent, setAgent] = useState(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const a = await api.getAgent(id)
        const aData = Array.isArray(a) ? a[0] : (a.data ?? a)
        const props = await api.getProperties({ agentId: id })
        const pData = Array.isArray(props) ? props : (props.data || [])
        if (!ignore) {
          setAgent(aData)
          setProperties(pData)
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [id])

  if (loading) return <section style={{ padding: 16 }}>Loading...</section>
  if (error) return <section style={{ padding: 16, color: 'crimson' }}>{error}</section>
  if (!agent) return <section style={{ padding: 16 }}>No agent found.</section>

  return (
    <section style={{ padding: 16 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, alignItems: 'center' }}>
          {(() => {
            const name = agent?.name || 'A'
            const avatar = agent?.profileImageUrl || agent?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=fff&size=160`
            return (
              <img
                src={avatar}
                alt={name}
                style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 8, background: '#e5e7eb', display: 'block' }}
                onError={(e)=>{ e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=fff&size=160` }}
              />
            )
          })()}
          <div>
            <h2 style={{ margin: '0 0 4px' }}>{agent.name || 'Agent'}</h2>
            <div style={{ color: '#6b7280' }}>{agent.email || ''} {agent.phone ? `· ${agent.phone}` : ''}</div>
            <div style={{ marginTop: 8 }}>{agent.bio || 'No bio provided.'}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              {agent.linkedin && <a href={agent.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
              {agent.telegram && <a href={agent.telegram} target="_blank" rel="noreferrer">Telegram</a>}
            </div>
          </div>
        </div>

        <div>
          <h3>Properties by {agent.name || 'agent'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {properties.map((p) => (
              <PropertyCard key={p.id || p._id} property={p} agent={agent} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
