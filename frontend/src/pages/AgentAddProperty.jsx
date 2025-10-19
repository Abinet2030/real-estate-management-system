import { useAuth } from '../context/AuthContext.jsx'
import { AddListingForm } from './SellerDashboard.jsx'

export default function AgentAddProperty() {
  const { user } = useAuth()
  return (
    <div style={{ maxWidth: 1000, margin: '24px auto', padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Add Property</h1>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
        <AddListingForm ownerId={null} agentId={user?.id} onCreated={() => { /* keep on page */ }} />
      </div>
    </div>
  )
}
