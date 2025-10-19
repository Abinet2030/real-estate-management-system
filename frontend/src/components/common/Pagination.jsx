export default function Pagination({ page = 1, total = 0, pageSize = 10, onPageChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  function go(p) {
    if (p < 1 || p > pages) return
    onPageChange?.(p)
  }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
      <button onClick={() => go(page - 1)} disabled={page <= 1}>Prev</button>
      <span>Page {page} of {pages}</span>
      <button onClick={() => go(page + 1)} disabled={page >= pages}>Next</button>
    </div>
  )
}
