import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Filters from '../components/common/Filters'
import PropertyCard from '../components/common/PropertyCard'
import Pagination from '../components/common/Pagination'
import api from '../services/api'
import './properties.css'

export default function Properties() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchParams] = useSearchParams()
  const initialFromQuery = useMemo(() => ({ type: (searchParams.get('type') || '').toLowerCase(), city: searchParams.get('city') || '' }), [searchParams])
  const [filters, setFilters] = useState(initialFromQuery)

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true); setError('')
      try {
        const res = await api.getProperties({ ...filters, page, pageSize: 12 })
        if (!ignore) {
          const data = Array.isArray(res) ? res : (res.data || [])
          setItems(data); setTotal(res.total ?? data.length)
        }
      } catch (e) {
        if (!ignore) {
          const message = e?.status === 404
            ? 'The listings service is unavailable right now. Please try again shortly.'
            : (e?.message || 'The listings service is temporarily unavailable.')
          setError(message)
        }
      } finally { if (!ignore) setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [filters, page])

  return (
    <section className="properties-page">
      <div className="properties-shell">
        <div className="properties-intro">
          <div>
            <p className="properties-eyebrow">Curated homes & spaces</p>
            <h1>Find a place that feels right.</h1>
            <p className="properties-lede">Browse thoughtfully listed homes, apartments, land, and commercial spaces in the locations you love.</p>
          </div>
          <div className="properties-trust"><span className="trust-mark">✓</span><span>Verified listings<br /><strong>updated regularly</strong></span></div>
        </div>
        <Filters initial={initialFromQuery} onChange={(vals) => { setPage(1); setFilters(vals) }} />
        <div className="results-bar">
          <div><p className="results-kicker">Available properties</p><h2>{loading ? 'Searching listings…' : `${total || items.length} properties to explore`}</h2></div>
          <span className="results-sort">Showing {items.length} listing{items.length === 1 ? '' : 's'}</span>
        </div>
        {loading && <div className="properties-message">Loading the latest listings…</div>}
        {error && <div className="properties-message properties-error">We couldn’t load listings right now. {error}</div>}
        {!loading && items.length === 0 ? (
          <div className="properties-message properties-empty"><span>⌂</span><h3>No properties found</h3><p>Try clearing a filter or searching a nearby location.</p></div>
        ) : (
          <div className="property-grid">{items.map((p) => <PropertyCard key={p.id || p._id} property={p} />)}</div>
        )}
        <Pagination page={page} total={total} pageSize={12} onPageChange={setPage} />
      </div>
    </section>
  )
}
