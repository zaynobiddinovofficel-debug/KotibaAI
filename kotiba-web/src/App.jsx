import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage  from './pages/DashboardPage'
import RemindersPage  from './pages/RemindersPage'
import TasksPage      from './pages/TasksPage'
import FinancePage    from './pages/FinancePage'
import ClientsPage    from './pages/ClientsPage'
import SettingsPage   from './pages/SettingsPage'
import './App.css'

// Himoyalangan route — kirmagan foydalanuvchini login ga yuboradi
function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div className="splash">Yuklanmoqda...</div>
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/reminders" element={<PrivateRoute><RemindersPage /></PrivateRoute>} />
      <Route path="/tasks"     element={<PrivateRoute><TasksPage /></PrivateRoute>} />
      <Route path="/finance"   element={<PrivateRoute><FinancePage /></PrivateRoute>} />
      <Route path="/clients"   element={<PrivateRoute><ClientsPage /></PrivateRoute>} />
      <Route path="/settings"  element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
