import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('auth:user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('auth:token') || '')

  useEffect(() => {
    if (user) localStorage.setItem('auth:user', JSON.stringify(user))
    else localStorage.removeItem('auth:user')
  }, [user])
  useEffect(() => {
    if (token) localStorage.setItem('auth:token', token)
    else localStorage.removeItem('auth:token')
  }, [token])

  // On load, if we have a user without an id but do have a token,
  // derive the user id from the JWT `sub` so features like "My Listings"
  // receive a valid ownerId.
  useEffect(() => {
    if (user && !user.id && token) {
      try {
        const [, payload] = token.split('.')
        if (payload) {
          const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
          const sub = json?.sub
          if (sub) setUser({ ...user, id: sub })
        }
      } catch {
        // ignore
      }
    }
  }, [user, token])

  function login(nextUser, nextToken) {
    setUser(nextUser)
    setToken(nextToken || '')
  }
  function logout() {
    setUser(null)
    setToken('')
  }

  const value = useMemo(() => ({ user, token, login, logout }), [user, token])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
