import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Bell, CheckSquare, Wallet, Settings } from 'lucide-react'

const TABS = [
  { path: '/dashboard', icon: Home,        label: 'Bosh' },
  { path: '/reminders', icon: Bell,        label: 'Eslatma' },
  { path: '/tasks',     icon: CheckSquare, label: 'Vazifa' },
  { path: '/finance',   icon: Wallet,      label: 'Moliya' },
  { path: '/settings',  icon: Settings,    label: 'Sozlama' },
]

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      {TABS.map(({ path, icon: Icon, label }) => {
        const active = pathname === path
        return (
          <button
            key={path}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
