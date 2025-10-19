export default function AdminSidebar({ activeKey = 'overview', onSelect = () => {}, isOpen = false, onClose = () => {} }) {
  const menu = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users Management' },
    { key: 'listings', label: 'Listings Approval' },
    { key: 'reports', label: 'Reports' },
    { key: 'settings', label: 'Settings' },
    { key: 'inquiries', label: 'Inquiries' },
  ]
  return (
    <>
      <div onClick={onClose} className="sidebar-overlay" style={{ display: isOpen ? 'block' : 'none' }} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ width: 240, background: '#0f172a', color: '#cbd5e1', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 60, borderRight: '1px solid #1e293b' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #1e293b', color: '#e2e8f0', fontWeight: 700, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>Admin Menu</span>
          <button onClick={onClose} className="only-mobile" aria-label="Close menu" style={{ background:'transparent', border:'1px solid #334155', color:'#cbd5e1', borderRadius:8, padding:'4px 8px' }}>✕</button>
        </div>
        <nav style={{ display: 'grid', padding: 8, gap: 6 }}>
          {menu.map((m) => {
            const active = m.key === activeKey
            return (
              <button
                key={m.key}
                onClick={() => { onSelect(m.key); onClose() }}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: active ? '#1f2937' : 'transparent',
                  color: active ? '#ffffff' : '#cbd5e1',
                  cursor: 'pointer',
                }}
              >
                {m.label}
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
