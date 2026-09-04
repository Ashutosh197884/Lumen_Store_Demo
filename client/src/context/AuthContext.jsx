import { createContext, useContext, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)
const KEY = 'lumen.session.v1'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const login = async (email, password) => {
    const { user: u, token } = await api.auth.login({ email, password })
    localStorage.setItem('lumen.token', token)
    localStorage.setItem(KEY, JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('lumen.token')
    localStorage.removeItem(KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isAdmin: user?.role === 'admin', login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
