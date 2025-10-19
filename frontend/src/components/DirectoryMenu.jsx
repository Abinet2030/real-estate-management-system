import { Link } from 'react-router-dom'

// Buyer directory menu (Properties removed as requested)
export default function DirectoryMenu() {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <Link to="/agents" style={{ padding:'6px 10px', borderRadius:8, textDecoration:'none', color:'#334155' }}>Agents</Link>
    </div>
  )
}
