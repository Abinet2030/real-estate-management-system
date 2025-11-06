import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Filters from '../components/common/Filters'
import PropertyCard from '../components/common/PropertyCard'
import Pagination from '../components/common/Pagination'
import api from '../services/api'

export default function Properties() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchParams] = useSearchParams()
  const initialFromQuery = useMemo(() => {
    // Map query params to filter keys used by Filters and API
    const type = (searchParams.get('type') || '').toLowerCase()
    const city = searchParams.get('city') || ''
    return {
      type,
      city,
    }
  }, [searchParams])
  const [filters, setFilters] = useState(initialFromQuery)

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        // Placeholder: backend should support pagination params: page, pageSize
        const res = await api.getProperties({ ...filters, page, pageSize: 12 })
        if (!ignore) {
          // Expecting { data: [], total } but fallback if plain array
          const data = Array.isArray(res) ? res : (res.data || [])
          setItems(data)
          setTotal(res.total ?? data.length)
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [filters, page])

  return (
    <section style={{ padding: '16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 12 }}>
        <h2>Explore Properties</h2>
        <Filters initial={initialFromQuery} onChange={(vals) => { setPage(1); setFilters(vals) }} />
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
        {(!loading && items.length === 0) ? (
          <div style={{ color: '#6b7280' }}>No property found.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {items.map((p) => (
              <PropertyCard key={p.id || p._id} property={p} />
            ))}
          </div>
        )}
        <Pagination page={page} total={total} pageSize={12} onPageChange={setPage} />
      </div>
    </section>
  )
}
