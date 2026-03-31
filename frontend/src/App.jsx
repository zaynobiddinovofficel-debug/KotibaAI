import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppHeader from './components/layout/AppHeader'
import BottomNav from './components/layout/BottomNav'
import ReminderToast from './components/common/ReminderToast'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import TasksPage from './pages/TasksPage'
import ExpensesPage from './pages/ExpensesPage'
import SettingsPage from './pages/SettingsPage'
import { usePushNotifications } from './hooks/usePushNotifications'

const PATH_TO_TAB = {
  '/': 'home',
  '/tasks': 'tasks',
  '/expenses': 'expenses',
  '/settings': 'settings'
}

const TAB_TO_PATH = {
  home: '/',
  tasks: '/tasks',
  expenses: '/expenses',
  settings: '/settings'
}

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const activeTab = PATH_TO_TAB[location.pathname] || 'home'

  const handleTabChange = (tab) => {
    navigate(TAB_TO_PATH[tab])
  }

  // Initialize push notifications listener
  usePushNotifications()

  return (
    <div className="min-h-screen bg-[#F8F7FF] dark:bg-[#0F0F1A]">
      <AppHeader />
      <ReminderToast />

      {/* Main content: padded top for header, bottom for bottom nav */}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/tasks"
            element={
              <div className="pt-14 pb-[calc(60px+env(safe-area-inset-bottom))] overflow-y-auto min-h-screen">
                <TasksPage />
              </div>
            }
          />
          <Route
            path="/expenses"
            element={
              <div className="pt-14 pb-[calc(60px+env(safe-area-inset-bottom))] overflow-y-auto min-h-screen">
                <ExpensesPage />
              </div>
            }
          />
          <Route
            path="/settings"
            element={
              <div className="pt-14 pb-[calc(60px+env(safe-area-inset-bottom))] overflow-y-auto min-h-screen">
                <SettingsPage />
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <BottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7FF] dark:bg-[#0F0F1A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#6C63FF] flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-bold">K</span>
          </div>
          <div className="w-7 h-7 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7FF] dark:bg-[#0F0F1A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#6C63FF] flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-bold">K</span>
          </div>
          <div className="w-7 h-7 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <RegisterPage />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
