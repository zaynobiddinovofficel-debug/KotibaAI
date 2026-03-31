import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('kotibaai_token')
    const savedUser = localStorage.getItem('kotibaai_user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {}
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { token, user } = res.data
    localStorage.setItem('kotibaai_token', token)
    localStorage.setItem('kotibaai_user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password })
    const { token, user } = res.data
    localStorage.setItem('kotibaai_token', token)
    localStorage.setItem('kotibaai_user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('kotibaai_token')
    localStorage.removeItem('kotibaai_user')
    setUser(null)
  }

  const updateUser = (updates) => {
    const updated = { ...user, ...updates }
    localStorage.setItem('kotibaai_user', JSON.stringify(updated))
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
