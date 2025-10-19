import { useAuth } from '../context/AuthContext.jsx'
import { MyListings } from './SellerDashboard.jsx'

export default function AgentMyListings() {
  const { user } = useAuth()
  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>My Listings</h1>
      <MyListings ownerId={null} agentId={user?.id} />
    </div>
  )
}
