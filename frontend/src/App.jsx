import './App.css'
import './styles/videos.css'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Contact from './pages/Contact'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom'
import Properties from './pages/Properties'
import PropertyDetails from './pages/PropertyDetails'
import About from './pages/About'
import Help from './pages/Help'
import Privacy from './pages/Privacy'
import AdminDashboard from './pages/AdminDashboard'
import SellerDashboard from './pages/SellerDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import BuyerMessages from './pages/BuyerMessages'

function App() {
  const location = useLocation()
  const hideGlobalNav = location.pathname.startsWith('/dashboard/admin') || location.pathname.startsWith('/dashboard/seller')
  return (
    <>
      {!hideGlobalNav && <NavBar />}
      {!hideGlobalNav ? (
        <div className="container" style={{ padding: 16 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            <Route path="/property/:id" element={<PropertyIdRedirect />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/messages"
              element={
                <ProtectedRoute roles={["buyer"]}>
                  <BuyerMessages />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/seller"
              element={
                <ProtectedRoute roles={["seller", "owner", "landlord"]}>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      ) : (
        <div style={{ padding: 0 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            <Route path="/property/:id" element={<PropertyIdRedirect />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/seller"
              element={
                <ProtectedRoute roles={["seller", "owner", "landlord"]}>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      )}
    </>
  )
}

export default App

// Local helper to redirect /property/:id -> /properties/:id while preserving the id param
function PropertyIdRedirect() {
  const { id } = useParams()
  return <Navigate to={`/properties/${id}`} replace />
}
