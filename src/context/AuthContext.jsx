import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const API_BASE = process.env.NODE_ENV === 'production' 
  ? '' // Same domain in production
  : 'http://localhost:5000'
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('auth')
    if (saved) {
      const { user, token } = JSON.parse(saved)
      setUser(user); setToken(token)
    }
  }, [])

  function save(u, t) {
    setUser(u); setToken(t)
    localStorage.setItem('auth', JSON.stringify({ user: u, token: t }))
  }

  function logout() {
    localStorage.removeItem('auth')
    setUser(null); setToken(null)
  }

  async function api(path, method = 'GET', body) {
    let res
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      })
    } catch (e) {
      throw new Error('Cannot reach the server. Please check your connection.')
    }
    let data = {}
    try { data = await res.json() } catch { /* no body */ }
    if (!res.ok) {
      if (res.status === 401 && !path.includes('/auth/login')) {
        localStorage.removeItem('auth')
        setUser(null)
        setToken(null)
      }
      throw new Error(data.error || 'Request failed')
    }
    return data
  }

  return (
    <AuthContext.Provider value={{ user, token, save, logout, api }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
