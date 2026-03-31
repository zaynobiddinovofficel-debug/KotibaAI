import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Barcha maydonlarni to\'ldiring')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Email yoki parol noto\'g\'ri')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF] dark:bg-[#0F0F1A] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#6C63FF] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#6C63FF]/30">
            <span className="text-white text-2xl font-bold">K</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KotibaAI</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Shaxsiy kotibingizga xush kelibsiz</p>
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Tizimga kirish</h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-4 border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                autoComplete="email"
                className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-gray-200 outline-none border-2 border-transparent focus:border-[#6C63FF] transition-colors placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 pr-12 text-sm text-gray-800 dark:text-gray-200 outline-none border-2 border-transparent focus:border-[#6C63FF] transition-colors placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#6C63FF] text-white font-semibold rounded-xl text-sm disabled:opacity-60 hover:bg-[#5A52E0] transition-colors mt-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Kirish...
                </>
              ) : (
                'Kirish'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            Hisobingiz yo'qmi?{' '}
            <Link to="/register" className="text-[#6C63FF] font-medium hover:underline">
              Ro'yxatdan o'tish
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
