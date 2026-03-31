import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from './BottomNav'

// Har bir sahifa uchun wrapper: yuqori header + pastki nav
export function Layout({
  title,
  children,
  rightAction,   // header o'ng tomondagi element (tugma yoki icon)
  showBack = false,
  onBack,
}) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <div className="page-wrapper">
      {/* Yuqori header */}
      <header className="page-header">
        {showBack ? (
          <button className="icon-btn" onClick={handleBack}>
            <ArrowLeft size={24} />
          </button>
        ) : (
          <div style={{ width: 36 }} />
        )}

        <h1 className="page-title">{title}</h1>

        <div style={{ width: 36 }}>
          {rightAction || null}
        </div>
      </header>

      {/* Asosiy kontent */}
      <main className="page-content">
        {children}
      </main>

      {/* Pastki navigatsiya */}
      <BottomNav />
    </div>
  )
}
