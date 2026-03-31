import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Sahifa yuklanganda localStorage dan o'qish
  useEffect(() => {
    const savedToken = localStorage.getItem('kotiba_token')
    const savedUser  = localStorage.getItem('kotiba_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  // Token saqlash
  const saveSession = (tok, usr) => {
    localStorage.setItem('kotiba_token', tok)
    localStorage.setItem('kotiba_user', JSON.stringify(usr))
    setToken(tok)
    setUser(usr)
  }

  // Telefon orqali kirish
  const login = async (phone) => {
    const res = await authApi.login(phone)
    const { token: tok, user: usr } = res.data
    saveSession(tok, usr)
    return res.data
  }

  // Ro'yxatdan o'tish
  const register = async (phone, name) => {
    const res = await authApi.register(phone, name)
    const { token: tok, user: usr } = res.data
    saveSession(tok, usr)
    return res.data
  }

  // PIN o'rnatish
  const setPin = async (pin) => {
    const res = await authApi.setPin(pin)
    return res.data
  }

  // Chiqish
  const logout = () => {
    localStorage.removeItem('kotiba_token')
    localStorage.removeItem('kotiba_user')
    setToken(null)
    setUser(null)
  }

  // Foydalanuvchi ma'lumotlarini yangilash
  const updateUser = (newUser) => {
    const updated = { ...user, ...newUser }
    localStorage.setItem('kotiba_user', JSON.stringify(updated))
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!token,
      login,
      register,
      setPin,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
