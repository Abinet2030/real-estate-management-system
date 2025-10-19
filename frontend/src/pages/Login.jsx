import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import './login.css'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('buyer') // buyer | seller | agent
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [profileImage, setProfileImage] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.login({ email: loginEmail, password: loginPassword })
      // Expecting { token, user }
      const token = res?.token || res?.access_token || ''
      const userFromApi = res?.user || { email: loginEmail, role: res?.role }
      // Helper: decode JWT payload safely (supports base64url)
      const decodeJwt = (tkn) => {
        try {
          if (!tkn) return null
          const [, payload] = tkn.split('.')
          if (!payload) return null
          return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
        } catch { return null }
      }
      // Fallback: if API didn't include user.id, derive it from JWT `sub`
      const payload = decodeJwt(token) || {}
      const derivedId = payload?.sub || ''
      // Fallback: derive role from JWT common claim keys if API omitted it
      const derivedRole = (() => {
        const candidates = [
          payload?.role,
          Array.isArray(payload?.roles) ? payload.roles[0] : undefined,
          payload?.['roles'],
          payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
          payload?.['realm_access']?.roles?.[0], // Keycloak style
          payload?.['permissions']?.[0],
        ].filter(Boolean)
        return (candidates[0] || '').toString()
      })()
      const user = { ...userFromApi, id: userFromApi?.id || derivedId, role: userFromApi?.role || derivedRole || 'buyer' }
      const roleLower = (user.role || '').toLowerCase()
      // Block login if seller/agent is pending approval
      if ((roleLower === 'seller' || roleLower === 'agent') && (user.status || '').toLowerCase() === 'pending') {
        setError(`Your ${roleLower} account is pending admin approval. Please try again later.`)
        return
      }
      auth.login(user, token)
      const role = roleLower
      const from = location.state?.from?.pathname
      if (from) {
        navigate(from, { replace: true })
      } else if (role === 'admin') {
        navigate('/dashboard/admin', { replace: true })
      } else if (role === 'seller' || role === 'owner' || role === 'landlord') {
        navigate('/dashboard/seller', { replace: true })
      } else {
        // Buyer default landing: Home
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    if (!name || !email || !password) {
      setError('Please fill all required fields.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      // NOTE: profileImage upload is not wired yet; send basic fields only
      const result = await api.register({
        name,
        email,
        password,
        role, 
        phone,
        address,
      })
      const isPendingRole = role === 'seller' || role === 'agent'
      const message = result?.message || (isPendingRole ? 'Registration received. Your account is pending admin approval.' : 'Registration successful.')

      if (!isPendingRole) {
        // For buyers (active accounts), auto-login to avoid confusion
        try {
          const res = await api.login({ email, password })
          const token = res?.token || res?.access_token || ''
          const userFromApi = res?.user || { email, role: res?.role || 'buyer' }
          // Helper: decode JWT payload safely (supports base64url)
          const decodeJwt = (tkn) => {
            try {
              if (!tkn) return null
              const [, payload] = tkn.split('.')
              if (!payload) return null
              return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
            } catch { return null }
          }
          const payload = decodeJwt(token) || {}
          const derivedId = payload?.sub || ''
          const derivedRole = (() => {
            const candidates = [
              payload?.role,
              Array.isArray(payload?.roles) ? payload.roles[0] : undefined,
              payload?.['roles'],
              payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
              payload?.['realm_access']?.roles?.[0],
              payload?.['permissions']?.[0],
            ].filter(Boolean)
            return (candidates[0] || '').toString()
          })()
          const user = { ...userFromApi, id: userFromApi?.id || derivedId, role: userFromApi?.role || derivedRole || 'buyer' }
          auth.login(user, token)
          setSuccessMessage(message)
          const from = location.state?.from?.pathname
          // Buyer default landing: Home
          navigate(from || '/', { replace: true })
          return
        } catch (loginAfterRegErr) {
          // Fallback to regular login screen if auto-login fails for any reason
          console.warn('Auto-login after registration failed:', loginAfterRegErr)
        }
      }

      // Seller/Agent or auto-login fallback: show message and switch to login tab
      setSuccessMessage(message)
      setMode('login')
      setLoginEmail(email)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="card">
          <div className="card-header">
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          </div>
          <div className="card-body">
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Login</button>
              <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Register</button>
            </div>

            {error && (
              <div className="error">{error}</div>
            )}
            {successMessage && (
              <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>
                {successMessage}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="form">
                <div className="field">
                  <label className="label">Email *</label>
                  <input className="input" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="field">
                  <label className="label">Password *</label>
                  <input className="input" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                </div>
                <button disabled={loading} type="submit" className="btn btn-primary">{loading ? 'Signing in...' : 'Login'}</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="form">
                <div className="field">
                  <label className="label">Full Name *</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="field">
                  <label className="label">Email *</label>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="row">
                  <div className="field">
                    <label className="label">Password *</label>
                    <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label className="label">Confirm Password *</label>
                    <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>
                <div className="field">
                  <label className="label">Role *</label>
                  <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="buyer">Buyer / Tenant</option>
                    <option value="seller">Seller / Property Owner</option>
                    <option value="agent">Agent / Professional</option>
                  </select>
                  {role === 'agent' && (
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                      Agent accounts require admin approval. Your Agent ID will be generated in the form <strong>AG123456</strong>.
                    </div>
                  )}
                </div>
                <div className="row">
                  <div className="field">
                    <label className="label">Phone</label>
                    <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label">Address</label>
                    <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label className="label">Profile Image (optional)</label>
                  <input className="file" type="file" accept="image/*" onChange={(e) => setProfileImage(e.target.files?.[0] ?? null)} />
                </div>
                <button disabled={loading} type="submit" className="btn btn-primary">{loading ? 'Registering...' : 'Register'}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
