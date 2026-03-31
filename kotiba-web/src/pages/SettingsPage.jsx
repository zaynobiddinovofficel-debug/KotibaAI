import { useNavigate } from 'react-router-dom'
import { Moon, Sun, LogOut, User, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Layout } from '../components/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export default function SettingsPage() {
  const { user, logout }        = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    if (!window.confirm('Hisobdan chiqasizmi?')) return
    logout()
    navigate('/login')
  }

  return (
    <Layout title='Sozlamalar'>
      <div className='page-list'>
        <Card className='profile-card'>
          <div className='profile-avatar'><User size={32} color='var(--primary)' /></div>
          <div>
            <div className='profile-name'>{user?.name || 'Foydalanuvchi'}</div>
            <div className='profile-phone'>{user?.phone || ''}</div>
          </div>
        </Card>

        <Card className='settings-row' onClick={toggleTheme} style={{ cursor: 'pointer' }}>
          <div className='settings-row-left'>
            {isDark ? <Moon size={22} color='#6C63FF' /> : <Sun size={22} color='#F59E0B' />}
            <div>
              <div className='settings-label'>{isDark ? "Qorongki tema" : "Yorug tema"}</div>
              <div className='settings-sublabel'>Temani almashtirish</div>
            </div>
          </div>
          <div className='settings-value'>{isDark ? 'Yoqilgan' : 'Ochirilgan'}</div>
        </Card>

        <Card className='settings-row' onClick={() => navigate('/clients')} style={{ cursor: 'pointer' }}>
          <div className='settings-row-left'>
            <span style={{ fontSize: 22 }}>👥</span>
            <div>
              <div className='settings-label'>Mijozlar</div>
              <div className='settings-sublabel'>Kontaktlar va Excel eksport</div>
            </div>
          </div>
          <ChevronRight size={18} color='var(--text-secondary)' />
        </Card>

        <Card className='settings-row'>
          <div className='settings-row-left'>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div>
              <div className='settings-label'>Kotiba AI</div>
              <div className='settings-sublabel'>Versiya 1.0.0 — React JS</div>
            </div>
          </div>
        </Card>

        <Button variant='danger' onClick={handleLogout} style={{ width: '100%', marginTop: 16 }}>
          <LogOut size={18} style={{ marginRight: 8 }} />
          Hisobdan chiqish
        </Button>
      </div>
    </Layout>
  )
}