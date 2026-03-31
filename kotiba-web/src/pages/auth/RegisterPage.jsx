import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function RegisterPage() {
  const location = useLocation()
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState(location.state?.phone || '+998')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const { register } = useAuth()
  const navigate     = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!name.trim())     { setError('Ism kiritilishi shart'); return }
    if (phone.length < 13){ setError('Telefon raqamini to\'liq kiriting'); return }
    setError('')
    setLoading(true)
    try {
      await register(phone, name.trim())
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Ro\'yxatdan o\'tishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">🤖</span>
          <h1 className="auth-logo-text">Kotiba AI</h1>
          <p className="auth-logo-sub">Yangi hisob yaratish</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <Input
            label="Ismingiz"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Masalan: Biloliddin"
            required
          />
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
            <UserPlus size={18} style={{ marginRight: 8 }} />
            Ro'yxatdan o'tish
          </Button>
        </form>

        <p className="auth-link-text">
          Hisob bormi?{' '}
          <Link to="/login" className="auth-link">Kirish</Link>
        </p>
      </div>
    </div>
  )
}
