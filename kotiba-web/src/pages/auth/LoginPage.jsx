import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function LoginPage() {
  const [phone,   setPhone]   = useState('+998')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (phone.length < 13) { setError('Telefon raqamini to\'liq kiriting'); return }
    setError('')
    setLoading(true)
    try {
      await login(phone)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Kirish xatolik'
      // Foydalanuvchi topilmasa — ro'yxatdan o'tkazish
      if (msg.includes('topilmadi') || msg.includes('not found') || err.response?.status === 404) {
        navigate('/register', { state: { phone } })
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-icon">🤖</span>
          <h1 className="auth-logo-text">Kotiba AI</h1>
          <p className="auth-logo-sub">Shaxsiy AI kotibingiz</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <Input
            label="Telefon raqam"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+998901234567"
            required
          />

          {error && <p className="error-text">{error}</p>}

          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 8 }}>
            <LogIn size={18} style={{ marginRight: 8 }} />
            Kirish
          </Button>
        </form>

        <p className="auth-link-text">
          Hisob yo'qmi?{' '}
          <Link to="/register" className="auth-link">Ro'yxatdan o'tish</Link>
        </p>
      </div>
    </div>
  )
}
