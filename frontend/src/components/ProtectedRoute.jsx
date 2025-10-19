import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (Array.isArray(roles) && roles.length > 0) {
    const role = (user.role || '').toLowerCase()
    const allowed = roles.map((r) => r.toLowerCase())
    if (!allowed.includes(role)) {
      // Not authorized for this route
      return <Navigate to={role === 'admin' ? '/dashboard/admin' : role === 'seller' || role === 'owner' || role === 'landlord' ? '/dashboard/seller' : '/'} replace />
    }
  }

  return children
}
